--luacheck: std lua51,module,read globals luup PFB,ignore 542 611 612 614 111/_,no max line length

module("L_Submasters1", package.seeall) -- !!! Fix name

_PLUGIN_NAME = "Submasters"	-- !!! Set me!
_PLUGIN_COMPACT = "Submasters"
_PLUGIN_ID = 9261
_PLUGIN_VERSION = "0.1develop-19213"
_PLUGIN_REQUESTNAME = _PLUGIN_COMPACT

MYTYPE = "urn:schemas-toggledbits-com:device:Submasters:1"	-- !!! Set me!
MYSID = "urn:toggledbits-com:serviceId:Submasters1"	-- !!! Set me!

--[[ ======================================================================= ]]

local Subs = {}
local Loads = {}
local Priority = "LTP"
local _UIV = 19213 -- UI version

-- Load other modules/packages like this:
local json = require "dkjson"

-- Shortcuts, because we can.
D = function( msg, ... ) PFB.log( PFB.LOGLEVEL.DEBUG1, msg, ... ) end
L = function( msg, ... ) PFB.log( PFB.LOGLEVEL.NOTICE, msg, ... ) end


--[[ ======================================================================= ]]

--[[   P L U G I N   M O D U L E   I M P L E M E N T A T I O N   ------------]]

local function updateStatus( pdev )
	D("updateStatus(%1)", pdev)
	local st = { subs=Subs, loads=Loads, timestamp=os.time() }
	PFB.var.set( "Status", json.encode( st ), pdev )
end

-- Update a submaster
local function updateSubmaster( subIndex, pdev )
	D("updateSubmaster(%1,%2)", subIndex, pdev)
	local sub = Subs[subIndex]
	if sub == nil then return end
	if "" == (sub.fader or "" ) then
		PFB.log('err', "Submaster %1:%2 fader not assigned!", sub.index, sub.id, sub.fader)
		return
	elseif luup.devices[ sub.fader ] == nil then
		PFB.log('err', "Submaster %1:%2 fader device #%3 no longer exists!", sub.index, sub.id, sub.fader)
		return
	end

	-- Get current status of this sub's fader
	local st = PFB.var.getNumeric( "Status", 0, sub.fader, "urn:upnp-org:serviceId:SwitchPower1" )
	if st ~= 0 then
		st = PFB.var.getNumeric( "LoadLevelStatus", 0, sub.fader, "urn:upnp-org:serviceId:Dimming1" )
	end
	sub.level = st
	sub.since = os.time()
	PFB.log( "info", "Submaster %1 fader %2 level change to %3%", sub.id, luup.devices[ sub.fader ].description, st )
	if Priority ~= "HTP" then -- LTP is the default
		-- LTP: last takes precedence
		for _,load in pairs( sub.loads or {} ) do
			-- Mark last sub to touch this load.
			Loads[tostring(load.device)].precsub = sub.index

			-- Target level for this load in this sub. If muted or a solo is set
			-- and we're not it, force target to 0.
			local tl = math.floor( ( load.level or 100 ) * st / 100 )
			if load.mute or ( sub.solo ~= nil and sub.solo ~= load.device ) then
				tl = 0
			end

			-- Set load
			if luup.devices[ load.device or -1 ] == nil then
				PFB.log('warn', "Submaster %1:%2 load device #%3 no longer exists!", sub.index, sub.id, load.device)
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
				PFB.log('warn', "Submaster %1:%2 load device #%3 no longer exists!", sub.index, sub.id, load.device)
			elseif not load.mute and ( sub.solo == nil or sub.solo == load.device ) then
				local ld = Loads[tostring(load.device)]

				-- Iterate over all subs that control this load; find max.
				local tmax = 0
				local smax = nil
				for _,ix in pairs( ld.subs or {} ) do
					-- Target level for this load in this sub
					local tl = math.floor( ( Subs[ix].loads[tostring(load.device)].level or 100 ) * ( Subs[ix].level or 0 ) / 100 )
					D("updateSubmaster() HTP mode: target for #%1 in sub %2:%3 is %4%%", load.device, ix, Subs[ix].id, tl)
					if smax == nil or tl > tmax then
						smax = ix
						tmax = tl
					end
				end

				ld.precsub = smax
				ld.preclevel = tmax
				D("updateSubmaster() HTP mode: highest for #%3 is sub %1:%2 at %3%%", smax, Subs[smax].id, tmax, load.device)
				luup.call_action( "urn:upnp-org:serviceId:Dimming1", "SetLoadLevelTarget", { newLoadlevelTarget=tostring(tmax) }, load.device )
			end
		end
	end
	PFB.delay.once( { id="update", seconds=1 }, updateStatus, pdev )
end

-- This example function will be called when our watched state variable changes.
local function faderChanged( dev, sid, var, oldVal, newVal, pdev )
	D("faderChanged(%1,%2,%3,%4,%5,%6)", dev, sid, var, oldVal, newVal, pdev)
	if PFB.var.getNumeric( "Enabled", 1 ) ~= 0 then
		for sub,d in pairs( Subs ) do
			if d.fader == dev then
				pcall( updateSubmaster, sub, pdev )
			end
		end
	end
end

local function loadChanged( dev, sid, var, oldVal, newVal, pdev )
	D("loadChanged(%1,%2,%3,%4,%5,%6)", dev, sid, var, oldVal, newVal, pdev)
	if PFB.var.getNumeric( "Enabled", 1 ) ~= 0 then
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
end

local function reloadSubmasters( pdev )
	D("reloadSubmasters(%1)", pdev)
	Subs = {}
	Loads = {}

	-- Make sure we're Enabled...
	if PFB.var.getNumeric( "Enabled", 1 ) == 0 then
		PFB.log( PFB.LOGLEVEL.notice, "Disabled by configuration." )
		PFB.var.set( "Message", "Disabled" )
		return true, "Disabled"
	end

	local dm = PFB.var.getNumeric( "DebugMode", 0 )
	if dm ~= 0 then
		PFB.loglevel = ( dm > 1 ) and dm or PFB.LOGLEVEL.DEBUG2
	else
		PFB.loglevel = PFB.LOGLEVEL.INFO
	end

	-- Load master config and set up internal structures.
	local s = PFB.var.get( "Configuration" ) or "{}"
	local cf = json.decode( s )
	if cf == nil then
		PFB.log( PFB.LOGLEVEL.err, "Invalid configuration." )
		PFB.var.set( "Message", "Invalid configuration" )
		return false, "Invalid configuration"
	end
	for n,sub in ipairs( cf.subs or {} ) do
		-- Watch our fader
		local fdev = sub.fader or ""
		Subs[n] = { index=n, id=sub.id, fader=fdev, loads={} }
		if "" ~= fdev then
			PFB.watch.set( sub.fader, "urn:upnp-org:serviceId:SwitchPower1", "Status", faderChanged )
			PFB.watch.set( sub.fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus", faderChanged )
			PFB.watch.set( sub.fader, MYSID, "Random", faderChanged )
		end
		for _,load in ipairs( sub.loads or {} ) do
			local ds = tostring(load.device)
			Subs[n].loads[ds] = { device=load.device, level=load.level }
			if not Loads[ds] then
				Loads[ds] = { device=load.device, subs={ n }, lastsub=nil }
			else
				table.insert( Loads[ds].subs, n )
			end
			PFB.watch.set( load.device, "urn:upnp-org:serviceId:SwitchPower1", "Status", loadChanged )
			PFB.watch.set( load.device, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus", loadChanged )
		end
	end
	return true, "OK"
end

local function configChanged( dev, sid, var, oldVal, newVal, pdev )
	D("configChanged(%1,%2,%3,%4b,%5b,%6)", dev, sid, var, #oldVal, #newVal, pdev)
	reloadSubmasters( pdev )
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
	D("start(%1)", pdev)


	-- Initialize your implementation local data here.
	PFB.var.set( "Message", "Starting..." )
	PFB.var.set( "_UIV", _UIV )
	PFB.var.init( "Enabled", "1" )
	PFB.var.init( "Configuration", "{}" )
	PFB.var.init( "Status", "{}" )
	PFB.var.init( "Random", "0" )
	Subs = {}
	Loads = {}

	-- Example: Make sure we're Enabled...
	if PFB.var.getNumeric( "Enabled", 1 ) == 0 then
		PFB.log( PFB.LOGLEVEL.notice, "Disabled by configuration; aborting startup." )
		PFB.var.set( "Message", "Disabled" )
		return true, "Disabled"
	end

	-- Load master config and set up internal structures.
	reloadSubmasters( pdev )

	-- Watch for configuration changes
	PFB.watch.set( pdev, MYSID, "Configuration", configChanged )

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
	elseif parameters.action == "checkupdate" then
		local status,updater = pcall( require, "GitUpdater" )
		if not status then
			return json.encode( { status=false, message="GitUpdater is not installed" } ), "application/json"
		end
		local lastv = luup.variable_get( MYSID, "_GUV", pdev ) or ""
		local update,rinfo = updater.checkForUpdate( "toggledbits", "Submasters-Vera", lastv~="" and lastv )
		return json.encode( { status=true, update=update, info=rinfo } )
	elseif parameters.action == "update" then
		local status,updater = pcall( require, "GitUpdater" )
		if not status then
			return json.encode( { status=false, message="GitUpdater is not installed" } ), "application/json"
		end
		local lastv = luup.variable_get( MYSID, "_GUV", pdev ) or ""
		local update,rinfo = updater.checkForUpdate( "toggledbits", "Submasters-Vera", lastv~="" and lastv )
		if update then
			local success,id = updater.doUpdate( rinfo )
			if success then
				luup.variable_set( MYSID, "_GUV", id, pdev )
			else
				return json.encode( { status=false, message="Update failed", detail=id } ), "application/json"
			end
		end
		return json.encode( { status=true, update=update, info=rinfo } )
	else
		return "ERROR\r\nInvalid request", "text/plain"
	end
end



--[[ ======================================================================= ]]

--[[   P L U G I N   A C T I O N   I M P L E M E N T A T I O N   ------------]]

