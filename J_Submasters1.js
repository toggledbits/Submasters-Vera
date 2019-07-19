//# sourceURL=J_Submasters1.js
/**
 * J_Submasters1.js
 * Configuration interface for Submasters1
 *
 * Copyright 2018,2019 Patrick H. Rigney, All Rights Reserved.
 * This file is part of Submaster. For license information, see LICENSE at https://github.com/toggledbits/Submasters
 *
 */
/* globals api,jQuery */
/* jshint multistr: true */

//"use strict"; // fails on UI7, works fine with ALTUI

var Submasters = (function(api, $) {

	/* unique identifier for this plugin... */
	var uuid = '30b20c8e-aa33-11e9-85e6-07d639dcca84'; /* Submasters 2019-07-19 */

	var pluginVersion = '0.1develop-19200';

	var _UIVERSION = 19200;     /* must coincide with Lua core */

	var myModule = {};

	var serviceId = "urn:toggledbits-com:serviceId:Submasters1";
	var deviceType = "urn:schemas-toggledbits-com:device:Submasters:1";

	var moduleReady = false;
	var roomsByName = [];
	var iData = [];
	var configModified = false;
	var isOpenLuup = false;
	// var isALTUI;
	
	var msgUnsavedChanges = "You have unsaved changes. Click OK to save them now, or cancel to discard them.";

	/* Insert the header items */
	function header() {
		var $head = jQuery( 'head' );
		/* Load material design icons */
		//$head.append('<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');
		$head.append( '\
<style>\
	div.submastertab {} \
	div#tbcopyright { display: block; margin: 12px 0px; } \
	div#tbbegging { display: block; color: #ff6600; margin-top: 12px; } \
</style>');
	}

	/* Return footer */
	function footer() {
		var html = '';
		html += '<div class="clearfix">';
		html += '<div id="tbbegging"><em>Find Submasters useful?</em> Please consider a small one-time donation to support this and my other plugins on <a href="https://www.toggledbits.com/donate" target="_blank">my web site</a>. I am grateful for any support you choose to give!</div>';
		html += '<div id="tbcopyright">Submasters ver ' + pluginVersion + ' &copy; 2019 <a href="https://www.toggledbits.com/" target="_blank">Patrick H. Rigney</a>,' +
			' All Rights Reserved. Please check out the <a href="https://github.com/toggledbits/Submasters-Vera/" target="_blank">online documentation</a>' +
			' and <a href="https://community.getvera.com/" target="_blank">community forums</a> for support.</div>';
		try {
			html += '<div id="browserident">' + navigator.userAgent + '</div>';
		} catch( e ) {}

		return html;
	}

	function idSelector( id ) {
		return String( id ).replace( /([^A-Z0-9_])/ig, "\\$1" );
	}

	/* Get parent state */
	function getParentState( varName, myid ) {
		var me = api.getDeviceObject( myid || api.getCpanelDeviceId() );
		return api.getDeviceState( me.id_parent || me.id, serviceId, varName );
	}

	/* Initialize the module */
	function initModule( myid ) {
		myid = myid || api.getCpanelDeviceId();
		if ( !moduleReady ) {

			/* Initialize module data (one-time) */
			console.log("Initializing module data for Submasters");
			try {
				console.log("initModule() using jQuery " + String(jQuery.fn.jQuery) + "; jQuery-UI " + String(jQuery.ui.version));
			} catch( e ) {
				console.log("initModule() error reading jQuery/UI versions: " + String(e));
			}

			iData = [];
			configModified = false;
			isOpenLuup = false;
			isALTUI = "undefined" !== typeof(MultiBox);

			/* Make our own list of devices, sorted by room, and alpha within room. */
			var devices = api.cloneObject( api.getListOfDevices() );
			var rooms = [];
			var noroom = { "id": 0, "name": "No Room", "devices": [] };
			rooms[noroom.id] = noroom;
			var dd = devices.sort( function( a, b ) {
				if ( a.id == myid ) return -1;
				if ( b.id == myid ) return 1;
				if ( a.name.toLowerCase() === b.name.toLowerCase() ) {
					return a.id < b.id ? -1 : 1;
				}
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});
			for (var i=0; i<dd.length; i+=1) {
				var devobj = dd[i];
				/* Detect openLuup while we're at it */
				if ( "openLuup" === devobj.device_type && 0 === devobj.device_num_parent ) {
					isOpenLuup = true;
				}

				var roomid = devobj.room || 0;
				var roomObj = rooms[roomid];
				if ( undefined === roomObj ) {
					roomObj = api.cloneObject( api.getRoomObject(roomid) );
					roomObj.devices = [];
					rooms[roomid] = roomObj;
				}
				roomObj.devices.push( devobj.id );
			}
			roomsByName = rooms.sort(
				/* Special sort for room name -- sorts "No Room" last */
				function (a, b) {
					if (a.id === 0) return 1;
					if (b.id === 0) return -1;
					if (a.name.toLowerCase() === b.name.toLowerCase()) return 0;
					return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
				}
			);

			/* Don't do this again. */
			moduleReady = true;
		}

		/* Check agreement of plugin core and UI */
		var s = api.getDeviceState( myid, serviceId, "_UIV", { dynamic: false } ) || "0";
		console.log("initModule() for device " + myid + " requires UI version " + _UIVERSION + ", seeing " + s);
		if ( String(_UIVERSION) != s ) {
			api.setCpanelContent( '<div class="reactorwarning" style="border: 4px solid red; padding: 8px;">' +
				" ERROR! The Submasters plugin core version and UI version do not agree." +
				" This may cause errors or corrupt your Submasters configuration." +
				" Please hard-reload your browser and try again " +
				' (<a href="https://duckduckgo.com/?q=hard+reload+browser" target="_blank">how?</a>).' +
				" If you have installed hotfix patches, you may not have successfully installed all required files." +
				" Expected " + String(_UIVERSION) + " got " + String(s) +
				".</div>" );
			return false;
		}

		/* Initialize for instance */
		console.log("Initializing Submasters instance data for " + myid);
		iData[myid] = iData[myid] || {};

		/* Event handler */
		api.registerEventHandler('on_ui_cpanel_before_close', Submasters, 'onBeforeCpanelClose');

		return true;
	}

/** ***************************************************************************
 *
 * C O N F I G U R A T I O N
 *
 ** **************************************************************************/

	function doConfiguration()
	{
		console.log("doConfiguration()");

		if ( configModified && confirm( msgUnsavedChanges ) ) {
			handleSaveClick( undefined );
		}

		if ( ! initModule() ) {
			return;
		}

		header();

		var html = '<div class="submastertab">';
		html += '</div>'; /* div.submastertab */

		html += footer();

		api.setCpanelContent( html );

		var $container = $( 'div.submastertab' );
	}

/** ***************************************************************************
 *
 * C L O S I N G
 *
 ** **************************************************************************/

	console.log("Initializing Submasters (UI7) module");

	return {
		uuid: uuid,
		onBeforeCpanelClose: onBeforeCpanelClose,
		onUIDeviceStatusChanged: onUIDeviceStatusChanged,
		doStatusPanel: doStatusPanel
	};

})(api, jQuery);
