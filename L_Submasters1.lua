--luacheck: std lua51,module,read globals luup PFB,ignore 542 611 612 614 111/_,no max line length

module("L_Submasters1", package.seeall) -- !!! Fix name

-- _PLUGIN_NAME: !!! Set this to the friendly name of your plugin

_PLUGIN_NAME = "Submasters"	-- !!! Set me!

-- _PLUGIN_IDENT: !!! Set this to the short name of your plugin. Generally,
--                this should match the filenames of the plugin files, without
--                the prefix and suffix... L_Submasters1.lua ==> Submasters

_PLUGIN_COMPACT = "Submasters"

-- _PLUGIN_REQUESTNAME: !!! Set this to name to be used in the "id" field of
--                      Luup requests for the plugin. Those requests would look
--                      like:
--                      http://vera-ip/port_3480/data_request?id=lr_Submasters
-- Default is same as compact, which is usually good and needs no changes.
_PLUGIN_REQUESTNAME = _PLUGIN_COMPACT

-- MYTYPE: The URN of your plugin's own device type. This must match exactly the
--         device type specified your device file (D_.xml)

MYTYPE = "urn:schemas-toggledbits-com:device:Submasters:1"	-- !!! Set me!

-- MYSID: The URN of your plugin's own service. This must match the service
--        named in the device file (D_.xml)
MYSID = "urn:toggledbits-com:serviceId:Submasters1"	-- !!! Set me!



--[[ ======================================================================= ]]

-- !!! Declare your module-global data here, and require any other modules your
--     implementation may need.

local Subs = {}
local Loads = {}
local Priority = "LTP"
local _UIV = 19200 -- UI version

-- Load other modules/packages like this:
local json = require "dkjson"

-- Shortcuts, because we can.
D = function( msg, ... ) PFB.log( PFB.LOGLEVEL.DEBUG1, msg, ... ) end
L = function( msg, ... ) PFB.log( PFB.LOGLEVEL.NOTICE, msg, ... ) end



--[[ ======================================================================= ]]

--[[   P L U G I N   M O D U L E   I M P L E M E N T A T I O N   ------------]]

-- !!! Add your implementation functions HERE. Modify the others below as indicated.

local function updateStatus( pdev )
	D("updateStatus(%1)", pdev)
	local st = { subs=Subs, loads=Loads, timestamp=os.time() }
	PFB.var.set( "Status", json.encode( st ), pdev )
end

-- Update a submaster
local function updateSubmaster( subID, pdev )
	D("updateSubmaster(%1,%2)", subID, pdev)
	local sub = Subs[subID]
	if sub == nil then return end
	if luup.devices[ sub.fader or -1 ] == nil then
		PFB.log('err', "Submaster %1 fader device #%2 no longer exists!", sub.id, sub.fader)
		return
	end
	-- Get current status of this sub's fader
	local st = PFB.var.getNumeric( "Status", 0, sub.fader, "urn:upnp-org:serviceId:SwitchPower1" )
	if st ~= 0 then
		st = PFB.var.getNumeric( "LoadLevelStatus", 0, sub.fader, "urn:upnp-org:serviceId:Dimming1" )
	end
	sub.level = st
	sub.since = os.time()
	if Priority ~= "HTP" then -- LTP is the default
		-- LTP: last takes precedence
		for _,load in pairs( sub.loads or {} ) do
			-- Mark last sub to touch this load.
			Loads[tostring(load.device)].precsub = sub.id

			-- Target level for this load in this sub. If muted or a solo is set
			-- and we're not it, force target to 0.
			local tl = math.floor( ( load.level or 100 ) * st / 100 )
			if load.mute or ( sub.solo ~= nil and sub.solo ~= load.device ) then
				tl = 0
			end

			-- Set load
			if luup.devices[ load.device or -1 ] == nil then
				PFB.log('warn', "Submaster %1 load device #%2 no longer exists!", sub.id, load.device)
			else
				if st == 0 then
					luup.call_action( "urn:upnp-org:serviceId:SwitchPower1", "SetTarget", { newTargetValue="0" }, load.device )
					Loads[tostring(load.device)].preclevel = 0
				else
					luup.call_action( "urn:upnp-org:serviceId:Dimming1", "SetLoadLevelTarget", { newLoadlevelTarget=tostring(tl) }, load.device )
					Loads[tostring(load.device)].preclevel = tl
				end
			end
		end
	else
		-- HTP: highest takes precedence
		for _,load in pairs( sub.loads or {} ) do
			if luup.devices[ load.device or -1 ] == nil then
				PFB.log('warn', "Submaster %1 load device #%2 no longer exists!", sub.id, load.device)
			elseif not load.mute and ( sub.solo == nil or sub.solo == load.device ) then
				local ld = Loads[tostring(load.device)]

				-- Iterate over all subs that control this load; find max.
				local tmax = 0
				local smax = nil
				for _,sc in pairs( ld.subs or {} ) do
					-- Target level for this load in this sub
					local tl = math.floor( ( Subs[sc].loads[tostring(load.device)].level or 100 ) * ( Subs[sc].level or 0 ) / 100 )
					D("updateSubmaster() HTP mode: target for #%3 in sub %1 is %2%%", sc.id, tl, load.device)
					if smax == nil or tl > tmax then
						smax = sc.id
						tmax = tl
					end
				end

				ld.precsub = smax
				ld.preclevel = tmax
				D("updateSubmaster() HTP mode: highest for #%3 is sub %1 at %2%%", smax, tmax, load.device)
				luup.call_action( "urn:upnp-org:serviceId:Dimming1", "SetLoadLevelTarget", { newLoadlevelTarget=tostring(tmax) }, load.device )
			end
		end
	end
	PFB.delay.once( { id="update", seconds=1 }, updateStatus, pdev )
end

-- This example function will be called when our watched state variable changes.
local function faderChanged( dev, sid, var, oldVal, newVal, pdev, sub )
	D("faderChanged(%1,%2,%3,%4,%5,%6,%7)", dev, sid, var, oldVal, newVal, pdev, sub)
	updateSubmaster( sub, pdev )
end

local function loadChanged( dev, sid, var, oldVal, newVal, pdev )
	D("loadChanged(%1,%2,%3,%4,%5,%6)", dev, sid, var, oldVal, newVal, pdev)
	if Loads[tostring(dev)] then
		local st
		if sid == "urn:upnp-org:serviceId:SwitchPower1" and var == "Status" then
			st = newVal == "0" and 0 or 1
		elseif sid == "urn:upnp-org:serviceId:Dimming1" and var == "LoadLevelStatus" then
			st = tonumber( newVal ) or 0
		end
		if st then
			Loads[tostring(dev)].level = st
			PFB.delay.once( { id="update", seconds=1 }, updateStatus, pdev )
		end
	end
end

function childRunOnce( child, pdev ) end

function childStart( child, pdev ) end

-- Check the current version of firmware running. Return true if OK, false and
-- error message if not. Modify this function as needed to do the right thing
-- for your plugin.
function checkVersion( pdev )
	D("checkVersion(%1)", pdev)
	--[[
	if PFB.isOpenLuup() then
		return false, "This plugin does not run on openLuup"
	end
	--]]
	if luup.version_major < 7 then
		return false, "This plugin only runs under UI7 or above"
	end
	return true
end

-- One-time initializations. Once the device is configured, this is not run again.
function runOnce( pdev )
	D("runOnce(%1)", pdev)
end

-- Do local initialization of plugin instance data and get things rolling.
function start( pdev )
PFB.loglevel = PFB.LOGLEVEL.DEBUG2
	D("start(%1)", pdev)


	-- Initialize your implementation local data here.
	PFB.var.set( "Message", "Starting..." )
	PFB.var.set( "_UIV", _UIV )
	PFB.var.init( "Enabled", "1" )
	PFB.var.init( "Configuration", "{}" )
	PFB.var.init( "Status", "{}" )
	Subs = {}
	Loads = {}

	-- Example: Make sure we're Enabled...
	if PFB.var.getNumeric( "Enabled", 1 ) == 0 then
		PFB.log( PFB.LOGLEVEL.err, "Disabled by configuration; aborting startup." )
		PFB.var.set( "Message", "Disabled" )
		return true, "Disabled"
	end

	-- Load master config and set up internal structures.
	local s = PFB.var.get( "Configuration" ) or "{}"
	local cf = json.decode( s )
	if cf == nil then
		PFB.var.set( "Message", "Invalid configuration" )
		return false, "Invalid configuration"
	end
	for _,sub in ipairs( cf.subs or {} ) do
		-- Watch our fader
		Subs[sub.id] = { id=sub.id, fader=sub.fader, loads={} }
		PFB.watch.set( sub.fader, "urn:upnp-org:serviceId:SwitchPower1", "Status", faderChanged, sub.id )
		PFB.watch.set( sub.fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus", faderChanged, sub.id )
		for _,load in ipairs( sub.loads or {} ) do
			local ds = tostring(load.device)
			Subs[sub.id].loads[ds] = { device=load.device, level=load.level }
			if not Loads[ds] then
				Loads[ds] = { device=load.device, subs={ sub.id }, lastsub=nil }
			else
				table.insert( Loads[ds].subs, sub.id )
			end
			PFB.watch.set( load.device, "urn:upnp-org:serviceId:SwitchPower1", "Status", loadChanged, sub.id )
			PFB.watch.set( load.device, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus", loadChanged, sub.id )
		end
	end

	L("Startup complete/successful!")
	PFB.var.set( "Message", "" )
	luup.set_failure( 0, pdev )
	return true, "OK"
end



-- Required function to handle Luup requests (can be empty, but don't remove).
-- This function should return two values: string result and MIME type; the
-- string will be the response body, and the MIME type will be returned in the
-- Content-Type header. You can return anything you want, but the most common
-- are probably plain text (MIME text/plain), HTML (text/html), JSON data
-- (application/json), and XML (text/xml or application/xml).
function handleRequest( request, parameters, outputformat, pdev )
	D("handleRequest(%1,%2,%3,%4)", request, parameters, outputformat, pdev)
	-- Example code to handle http://your-vera-ip/port_3480/data_request?id=lr_Submasters&action=say&text=something
	if parameters.action == "say" then
		-- Return text as JSON-formatted response.
		return '{ "text": ' .. tostring(parameters.text) .. ' }', "application/json"
		-- or if we load the dkjson package and make it do the formatting of a Lua table:
		-- local json = require "dkjson"
		-- return json.encode( { text=parameters.text } ), "application/json"
	else
		return "ERROR\r\nInvalid request", "text/plain"
	end
end



--[[ ======================================================================= ]]

--[[   P L U G I N   A C T I O N   I M P L E M E N T A T I O N   ------------]]

--[[
	!!! Put your action implementation functions down here. These should be
	    called from the implementation file's <action> tag for the action.
		Remember to return appropriate values for the type of action execution.
		<run> should return boolean true/false, <job> should return status
		and timeout (0 if you're not sure what that means).
		See http://wiki.micasaverde.com/index.php/Luup_Lua_extensions#function:_job_watch
--]]

-- Here's an example action implementation. It just does some nonsense thing
-- (sets the Message variable to whatever). Note that the function is
-- not "local", so it can be seen from I_Submasters1.xml
function actionExample( pdev, parms )
	D("actionExample(%1,%2)", pdev, parms)
	-- Use: luup.call_action( "urn:yourdomain-name:serviceId:Submasters1", "Example", { newValue="23" }, n )
	PFB.var.set( "Message", parms.newValue )
end