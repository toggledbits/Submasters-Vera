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

	var pluginVersion = '0.1develop-19213';

	var _UIVERSION = 19213;     /* must coincide with Lua core */

	var myModule = {};

	var serviceId = "urn:toggledbits-com:serviceId:Submasters1";
	var deviceType = "urn:schemas-toggledbits-com:device:Submasters:1";
	
	var DIMMERSID = "urn:upnp-org:serviceId:Dimming1";
	var SWITCHSID = "urn:upnp-org:serviceId:SwitchPower1";

	var moduleReady = false;
	var isOpenLuup = false;
	// var isALTUI;
	var roomsByName = [];
	var iData = [];
	var configModified = false;
	var inStatusPanel = false;
	var fadeTimer = null;
	var faderValue = 100;
	var flashTimer = false;

	var msgUnsavedChanges = "You have unsaved changes. Click OK to save them now, or cancel to discard them.";

	function TBD() { console.log("TBD!!!"); }

	/* Insert the header items */
	function header() {
		var $head = $( 'head' );
		/* Load material design icons */
		$head.append('<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');
		//$head.append( '<script src="http://www.toggledbits.com/assets/submasters/toggledbits-channelbutton.js"></script>' );
		$head.append( '\
<style>\
	div.tbsubmasters {} \
	div.tbsubmasters div.submastertab {} \
	div.tbsubmasters .sliderblock { margin: 0 0; padding: 0 0; display: inline-block; vertical-align: top; } \
	div.tbsubmasters .subslider { margin: 0px 0px; padding: 0px 0px; } \
	div.tbsubmasters .ui-slider { background-image: url(http://www.toggledbits.com/assets/submasters/slider-body.png); width: 75px; height: 180px; } \
	div.tbsubmasters .ui-slider .ui-slider-handle { background: transparent url(http://www.toggledbits.com/assets/submasters/slider-handle.png) no-repeat scroll 100% 100%; width: 66px; height: 17px; border-style: none; } \
	div.tbsubmasters .ui-slider .ui-corner-all,.ui-widget-content { border-style: none; border-radius: 0; } \
	div.tbsubmasters .ui-slider a:active { border-style: none; text-decoration: none; } \
	div.tbsubmasters div.sliderblock #value { width: 75px; text-align: center; font-family: monospace; font-size: 24px; font-weight: bold; } \
	div.tbsubmasters div#name { width: 100%; overflow: hidden; padding: 2px 2px; background-color: #000; color: rgb(0,224,0); font-size: 14px; font-weight: normal; text-align: center; } \
	div.tbsubmasters div#status { width: 100%; overflow: hidden; padding: 2px 8px; background-color: #000; color: rgb(0,224,0); font-family: monospace; font-size: 18px; font-weight: normal; } \
	div.tbsubmasters div.substatus {} \
	div.substatus #tbchannellist { background-color: rgb(0,32,96); color: white; overflow-y: auto; overflow-x: hidden; max-height: 224px; } \
	div.substatus #tbchannellist .row { margin: 0px 0px; padding: 0px 0px; } \
	div.substatus #tbchannellist .row div { border: 2px solid rgb(0,24,64); padding: 2px 2px; } \
	div.substatus #tbchannellist .tbcenter { text-align: center; } \
	div.substatus #tbchannellist .tbheadrow { font-weight: bold; text-align: center } \
	div.tbsubmasters i.material-icons.md16 { font-size: 16px; vertical-align: middle; margin-left: 4px; } \
	div.submastertab div.channelbutton { width: 80px; height: 80px; margin: 0; padding: 0; text-align: center; } \
	div.submastertab div.channelbutton-label { border: 3px solid black; border-bottom: none; border-radius: 12px 12px 0px 0px; color: #000; width: 100%; height: 40%; display: block; background-color: #cff; } \
	div.submastertab div.channelbutton-label.disabled { cursor: not-allowed; } \
	div.submastertab div.channelbutton-label-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-label-text { font-size: 18px; font-weight: bold; font-family: OpenSansLight,Arial,sans-serif; line-height: 0.9em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab div.channelbutton-base { border: 3px solid black; border-radius: 0px 0px 12px 12px; color: #000; width: 100%; height: 60%; display: block; } \
	div.submastertab div.channelbutton.selected .channelbutton-base { background-color: #0f8; } \
	div.submastertab div.channelbutton-base.disabled { cursor: not-allowed; } \
	div.submastertab div.channelbutton-base-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-value-text { font-size: 14px; font-weight: bold; line-height: 1.15em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab .channel { float: left !important; margin: 2px 3px 3px 2px !important; } \
	div.submastertab div#tbtabs { margin: 0; padding: 0; background-color: #eee; overflow: hidden; } \
	div.submastertab div#tbtabs ul { margin: 0; padding: 8px 0 0 0; } \
	div.submastertab div#tbtabs li { list-style: none; float: left; position: relative; top: 0px; min-height: 36px; border: none; padding: 4px 8px; border-radius: 8px 8px 0 0; text-align: center; background-color: rgb(246,246,246); } \
	div.submastertab div#tbtabs li:hover { cursor: pointer; background-color: rgb(192,192,192); } \
	div.submastertab div#tbtabs li:active { cursor: pointer; border-color: rgb(0,127,255); } \
	div.submastertab div#tbtabs li.selected { background-color: rgb(0,127,255); color:white; } \
	div.submastertab div#tbtabbody { background-color: #fff; padding: 8px; } \
	div.submastertab .tbflashon { background-color: rgb(255,0,0) !important; } \
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

	/* Return true if device implements requested service */
	function deviceImplements( devobj, service ) {
		if ( undefined === devobj ) { return false; }
		for ( var svc in devobj.ControlURLs ) {
			if ( devobj.ControlURLs[svc].service == service ) {
				return true;
			}
		}
		return false;
	}

	/* Is device a dimmer? */
	function isDimmer( devnum, devobj ) {
		devobj = devobj || api.getDeviceObject( devnum );
		if ( devobj ) {
			return devobj.category_num == 2 || deviceImplements( devobj, "urn:upnp-org:serviceId:Dimming1" );
		}
		return false;
	}

	function _flash() {
		var $f = $( '.tbflash' );
		if ( $f.length > 0 ) {
			$f.toggleClass( "tbflashon" );
			flashTimer = window.setTimeout( _flash, 250 );
		} else {
			flashTimer = false;
		}
	}

	function flash( $el, state ) {
		if ( false === state ) {
			$el.removeClass( "tbflash tbflashon" );
		} else {
			$el.addClass( "tbflash" );
			if ( !flashTimer ) {
				flashTimer = window.setTimeout( _flash, 250 );
			}
		}
	}

	/* Closing the control panel. */
	function onBeforeCpanelClose(args) {
		// console.log( 'onBeforeCpanelClose args: ' + JSON.stringify(args) );
		if ( configModified && confirm( msgUnsavedChanges ) ) {
			alert("TBD");
		}
		configModified = false;
		inStatusPanel = false;
	}

	/* Initialize the module */
	function initModule( myid ) {
		myid = myid || api.getCpanelDeviceId();
		if ( !moduleReady ) {

			/* Initialize module data (one-time) */
			console.log("Initializing module data for Submasters");
			try {
				console.log("initModule() using jQuery " + String($.fn.jquery) + "; jQuery-UI " + String($.ui.version));
			} catch( e ) {
				console.log("initModule() error reading jQuery/UI versions: " + String(e));
			}

			iData = [];
			configModified = false;
			isOpenLuup = false;
			isALTUI = "undefined" !== typeof(MultiBox);

			/* Make our own list of devices, sorted by room, and alpha within room. */
			var devices = api.cloneObject( api.getListOfDevices() );
			var noroom = { "id": 0, "name": "No Room", "devices": [] };
			var rooms = [ noroom ];
			var roomIx = {};
			roomIx[String(noroom.id)] = noroom;
			var dd = devices.sort( function( a, b ) {
				if ( a.name.toLowerCase() === b.name.toLowerCase() ) {
					return a.id < b.id ? -1 : 1;
				}
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});
			for (var i=0; i<dd.length; i+=1) {
				var devobj = api.cloneObject( dd[i] );
				/* Detect openLuup while we're at it */
				if ( "openLuup" === devobj.device_type ) {
					isOpenLuup = true;
				}

				var roomid = devobj.room || 0;
				var roomObj = roomIx[String(roomid)];
				if ( undefined === roomObj ) {
					roomObj = api.cloneObject( api.getRoomObject(roomid) );
					roomObj.devices = [];
					roomIx[String(roomid)] = roomObj;
					rooms[rooms.length] = roomObj;
				}
				roomObj.devices.push( devobj );
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

		/* Other initializations */
		inStatusPanel = false;

		/* Event handler */
		api.registerEventHandler('on_ui_cpanel_before_close', Submasters, 'onBeforeCpanelClose');

		return true;
	}

	/* Get data for this instance */
	function getInstanceData( myid ) {
		myid = myid || api.getCpanelDeviceId();
		iData[ myid ] = iData[ myid ] || {};
		return iData[ myid ];
	}

	/* Get configuration for device (default current) */
	function getConfiguration( myid, force ) {
		myid = myid || api.getCpanelDeviceId();
		var d = getInstanceData( myid );
		if ( force || ! d.config ) {
			var s = api.getDeviceState( myid, serviceId, "Configuration", { dynamic: false } ) || "";
			try {
				if ( "0" === s || "" === s ) {
					console.log("Submasters.getConfiguration created empty/new configuration");
				} else {
					d.config = JSON.parse( s );
					console.log("Submasters.getConfiguration loaded serial "+String(d.config.serial));
				}
			} catch (e) {
				console.log("Submasters.getConfiguration: failed to parse configuration: "+String(s));
				d.config = false;
			}
			if ( ! d.config ) {
				d.config = { version: 19201, serial: 0, timestamp: 0, subs: [ { id: "Sub1", loads: [] } ] };
			}
			d.config.subs = d.config.subs || [];
			d.loads = [];
			d.loadIndex = {};
			for ( var ix=0; ix<d.config.subs.length; ix++ ) {
				d.config.subs[ix].__index = ix;
				for ( var il=0; il<(d.config.subs[ix].loads || []).length; il++ ) {
					var load = d.config.subs[ix].loads[il];
					if ( !d.loadIndex[String(load.device)] ) {
						var devobj = api.getDeviceObject( load.device );
						var lob = { device: load.device, limit: load.value,
							name: devobj ? devobj.name : ("Missing #"+load.device) };
						d.loads[d.loads.length] = lob;
						d.loadIndex[String(load.device)] = true;
					}
				}
			}
			d.loads = d.loads.sort( function( a, b ) {
				if ( a.name.toLowerCase() === b.name.toLowerCase() ) return 0;
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});
		} else {
			console.log("getConfiguration(): returning cached config serial " + String(d.config.serial));
		}
		return d.config;
	}

	function saveConfiguration( myid, callback ) {
		if ( configModified ) {
			myid = myid || api.getCpanelDeviceId();
			var config = getConfiguration( myid );
			config.serial = ( config.serial || 0 ) + 1;
			config.timestamp = new Date().getTime() / 1000;
			console.log("saveConfiguration: saving serial "+config.serial+" timestamp "+config.timestamp);
			api.setDeviceStatePersistent( myid, serviceId, "Configuration",
				JSON.stringify( config, function( k, v ) { return k.match( /^__/ ) ? undefined : v; } ),
				{
					'onSuccess' : function() {
						configModified = false;
						if ( callback ) callback( true );
					},
					'onFailure' : function() {
						alert('There was a problem saving the modified configuration. Vera/Luup may be restarting. Please try again.');
						if ( callback ) callback( false );
					}
				}
			);
		} else if ( callback ) {
			callback( null );
		}
	}

	function updateFader( fader, val ) {
		if ( fadeTimer ) {
			window.clearTimeout( fadeTimer );
		}
		fadeTimer = null;
		api.performActionOnDevice( fader, "urn:upnp-org:serviceId:Dimming1", "SetLoadLevelTarget", {
			actionArguments: { newLoadlevelTarget: val },
			onSuccess: function( xhr ) {
				console.log("performActionOnDevice.onSuccess: " + String(xhr));
				api.setDeviceStatePersistent( fader, serviceId, "Random", Math.random() );
			},
			onFailure: function( xhr ) {
				//??? are there undocumented parameters here?
				if (typeof(xhr)==="object") {
					for ( var k in xhr ) {
						if ( xhr.hasOwnProperty(k) )
							console.log("xhr." + k + "=" + String(xhr[k]));
					}
				}
				alert( "An error occurred. Try again in a moment; Vera may be busy. TO-DO: NEED A BETTER WAY TO SHOW ERROR." );
			}
		} );
	}

	function onUIDeviceStatusChanged( args ) {
		if ( !inStatusPanel ) {
			return;
		}
		var pdev = api.getCpanelDeviceId();
		var k, val;
		if ( args.id == pdev ) {
			for ( k=0; k<(args.states || []).length; k++ ) {
				if ( args.states[k].service == serviceId && args.states[k].variable == "Status" ) {
					val = args.states[k].value;
					try {
						val = JSON.parse( val );
					} catch (e) {
						console.log("Can't parse Status content: " + String(e));
						console.log(e);
						val = false;
					}
					if ( val ) {
						var cf = getConfiguration( pdev );
						for ( var l in (val.loads || {}) ) {
							if ( val.loads.hasOwnProperty(l) ) {
								$( '#tbchannellist div#' + idSelector( l ) + ".tbdevrow" ).each( function() {
									var p = val.loads[l].precsub;
									$( 'div#sub', $(this) ).text( cf.subs[p-1].id || p || "?" );
								});
							}
						}
					}
					break;
				}
			}
		} else {
			/* No changes if channels are selected (editing in Config tab) */
			if ( $('.channel.selected').length > 0 ) return;

			for ( k=0; k<(args.states || []).length; k++ ) {
				if ( args.states[k].service == "urn:upnp-org:serviceId:Dimming1" &&
						args.states[k].variable === "LoadLevelStatus" ) {
					val = args.states[k].value;
					/* Fader? */
					var $ff = $( '.tbsubmasters .subslider[data-fader="'+args.id+'"]' );
					$ff.slider( "option", "value", val );
					/* Channel Button? */
					$( '.channelbutton[data-smload="'+args.id+'"]' ).each( function() {
						$(this).channelbutton( "option", "value", val );
					});
					/* Channel list row (status)? */
					$( '#tbchannellist div#' + idSelector( args.id ) + '.tbdevrow' ).each( function() {
						$( 'div#lvl', $(this) ).text( val );
					});
					break;
				}
			}
		}
	}

/** ***************************************************************************
 *
 * S T A T U S
 *
 ** **************************************************************************/
 
	function _doStatus() {
		console.log("_doStatus()");

		var myid = api.getCpanelDeviceId();

		if ( configModified && confirm( msgUnsavedChanges ) ) {
			handleSaveClick();
		}

		if ( ! initModule() ) {
			return;
		}

		var cf = getConfiguration( myid, true );
		var dd = getInstanceData( myid );

		inStatusPanel = true;

		header();

		var html = '<div class="tbsubmasters substatus"></div>';
		html += footer();

		api.setCpanelContent( html );

		var $container = $( 'div.tbsubmasters.substatus' );

		var $el = $( '<div/>', { id: 'tbchannellist' } ).appendTo( $container );
		var $row = $('<div/>', { class: "tbheadrow row" } ).appendTo( $el );
		$( '<div class="col-xs-1 col-sm-1"/>' ).text( "Dev#" ).appendTo( $row );
		$( '<div class="col-xs-4 col-sm-4"/>' ).text( "Device Name" ).appendTo( $row );
		$( '<div class="col-xs-1 col-sm-1"/>' ).text( "Level" ).appendTo( $row );
		$( '<div class="col-xs-3 col-sm-3"/>' ).text( "Last Sub" ).appendTo( $row );
		$( '<div class="col-xs-3 col-sm-3"/>' ).text( "-" ).appendTo( $row );
		for ( var il=0; il<dd.loads.length; ++il ) {
			var load = dd.loads[il];
			$row = $('<div/>', { id: load.device, class: "tbdevrow row" } )
				.appendTo( $el );
			$('<div class="col-xs-1 col-sm-1 tbcenter"/>').text( load.device ).appendTo( $row );
			$('<div class="col-xs-4 col-sm-4"/>').text( load.name ).appendTo( $row );
			$('<div id="lvl" class="col-xs-1 col-sm-1 tbcenter"/>').text( 'lvl' ).appendTo( $row );
			$('<div id="sub" class="col-xs-3 col-sm-3 tbcenter"/>').text( 'sub' ).appendTo( $row );
			$('<div id="qqq" class="col-xs-3 col-sm-3 tbcenter"/>').text( "-" ).appendTo( $row );
		}

		$el = $( '<div/>', { id: 'tbsublist' } ).appendTo( $container );
		$( '<div class="clearfix"/>' ).appendTo( $container );

		for ( var k=0; k<(cf.subs || []).length; k++ ) {
			var sub = cf.subs[k];
			if ( "" === ( sub.fader || "" ) ) continue;
			var $d = $( '\
<div class="sliderblock" style="margin: 0 0; padding: 0 0; display: inline-block; vertical-align: top;">\
	<div id="name">???</div>\
	<img src="http://www.toggledbits.com/assets/submasters/slider-top.png">\
	<div id="' + k + '" class="subslider" data-fader=""></div>\
	<img src="http://www.toggledbits.com/assets/submasters/slider-bottom.png">\
	<div id="value">100</div>\
</div>')
				.appendTo( $el );
			$( '.subslider', $d ).data( 'fader', sub.fader || "" )
				.attr( 'data-fader', sub.fader || "" );
			$( '#name', $d ).text( String(sub.id).substring( 0, 8 ) )
				.attr( 'title', sub.id );
		}

		$( ".subslider", $el ).slider({
			orientation: "vertical",
			min: 0,
			max: 100,
			value: 100,
			slide: function( event, ui ) {
				if ( fadeTimer ) {
					window.clearTimeout( fadeTimer );
				}
				fadeTimer = window.setTimeout( TBD, 500 );
				$( '#value', $(this).closest('.sliderblock') ).text( $(this).slider( "value" ) );
			},
			start: function( event, ui ) {},
			stop: function( event, ui ) {
				if ( fadeTimer ) {
					window.clearTimeout( fadeTimer );
				}
				var val = $(this).slider( "value" );
				$( '#value', $(this).closest('.sliderblock') ).text( val );
				updateFader( $(this).data( 'fader' ), val );
			},
			change: function( event, ui ) {
				var val = $(this).slider( "value" );
				$( '#value', $(this).closest('.sliderblock') ).text( val );
			}
		});

		/* Special keyboard handling for slider handle */
		$( '.subslider a.ui-slider-handle', $el ).on( "keyup", function( event ) {
			var $sl = $(this).closest(".subslider");
			var val;
			if ( event.keyCode >= 48 && event.keyCode <= 57 ) {
				/* 0-9 sets level to 10x */
				$sl.slider( "value", ( event.keyCode - 48 ) * 10 );
				event.preventDefault();
			} else if ( "f" === event.key || "F" === event.key ) {
				/* "F" upper or lower sets level to full/100% */
				$sl.slider( "value", 100 );
				event.preventDefault();
			} else if ( "+" === event.key || "=" === event.key ) {
				/* "+" increases level (alt "=" is unshift "+" on US keyboards) */
				val = $sl.slider( "value" ) + ( event.shiftKey ? 10 : 5 );
				if ( val > 100 ) val = 100;
				$sl.slider( "value", val );
				event.preventDefault();
			} else if ( "-" === event.key || "_" === event.key ) {
				/* "-" decreates level (alt "_" is shift "-" on US keyboards) */
				val = $sl.slider( "value" ) - ( event.shiftKey ? 10 : 5 );
				if ( val < 0 ) val = 0;
				$sl.slider( "value", val );
				event.preventDefault();
			} else if ( event.keyCode == 32 ) {
				/* Space toggles on/off */
				val = $sl.slider( "value" );
				val = val > 0 ? 0 : 100;
				$sl.slider( "value", val );
				event.preventDefault();
			}
			updateFader( $sl.data( 'fader' ), $sl.slider( 'value' ) );
		});

		$( '.subslider', $el ).each( function() {
			var fader = $(this).data( 'fader' );
			var level = api.getDeviceState( fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" );
			$(this).slider( "value", parseInt( level ) );
		});


		api.registerEventHandler('on_ui_deviceStatusChanged', Submasters, 'onUIDeviceStatusChanged');
	}

/** ***************************************************************************
 *
 * C O N F I G U R A T I O N
 *
 ** **************************************************************************/

	function getCurrentSubIndex() {
		return parseInt( $("#tbtabbody").data("subindex") || "0" );
	}

	function getCurrentSub() {
		return getConfiguration().subs[getCurrentSubIndex()];
	}

	function clearSelection() {
		// https://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
		if (window.getSelection) {
		  if (window.getSelection().empty) {  // Chrome
			window.getSelection().empty();
		  } else if (window.getSelection().removeAllRanges) {  // Firefox
			window.getSelection().removeAllRanges();
		  }
		} else if (document.selection) {  // IE?
		  document.selection.empty();
		}
	}

	var messageTimer = null;
	var msgs = [];
	var lastMsg = 0;
	function scrollMessage( lastMsg ) {
		if (++lastMsg >= msgs.length ) lastMsg = 0;
		$( '#tbtabbody #status' ).text( msgs[lastMsg] );
		if ( msgs.length > 1 ) {
			messageTimer = setTimeout( function() { scrollMessage( lastMsg ); }, 3000 );
		} else {
			messageTimer = null;
		}
	}

	function setMessages( ar ) {
		if ( messageTimer ) {
			window.clearTimeout( messageTimer );
		}
		if ( ar && ar.length ) {
			msgs = ar;
		} else {
			msgs = [""];
			$( '#tbtabbody #status' ).text( "" );
		}
		scrollMessage( 32767 );
	}

	function applySlider() {
		console.log("TICK");
		var ui = $( 'div#tbtabbody .subslider' );
		var val = ui.slider("value");
		fadeTimer = null;
		if ( 0 === $('.channel.selected').length ) {
			faderValue = val;
			var fader = getCurrentSub().fader;
			if ( "" !== (fader||"") ) {
				updateFader( fader, val );
			}
		}
	}

	function handleSlider( ui ) {
		var val = ui.slider("value");
		$('#tbtabbody #value').text( val );
		var cbs = $('.channel.selected');
		if ( 0 === cbs.length ) {
			/* No channels selected, treat as sub fader */
			faderValue = val;
		} else {
			/* Channel(s) selected; assign fader value to channel */
			var sub = getCurrentSub();
			cbs.each( function() {
				jQuery(this).channelbutton("option", "value", val );
				var ch = parseInt( $(this).attr( 'id' ).replace( 'channel', '' ) );

				sub.loads[ch-1].level = val;
				configModified = true;
			});
		}
	}

	function inMimic() {
		return "" === ( $("#tbtabbody").data("mode") || "" );
	}

	function inAssign() {
		return "assign" === $("#tbtabbody").data("mode");
	}

	function inEdit() {
		return "edit" === $('#tbtabbody').data('mode');
	}

	function goMimic() {
		$('#tbtabbody').data('mode','').attr('data-mode','');
		setMessages( [
			"Mimic Mode -- slider controls submaster fader",
			"Channel buttons show current intensity of each assigned load",
			"Click a channel header to set/change assigned device",
			"Click a channel intensity to change level",
			"Fader has shortcuts: up/down arrows, 0-9, F, +/- (try shift), space"
		] );
	}

	function cancelAssign() {
		if ( inAssign() ) {
			var $dp = $( '#tbtabbody div#dpanel' ).slideUp();
			$( '#tbtabbody .channelbutton-label.tbflash' ).removeClass( "tbflash tbflashon" );
			$('#tbtabbody').data('mode', '').attr('data-mode', '');
		}
	}

	function assignDevice() {
		if ( ! inAssign() ) return;
		var $dp = $( '#tbtabbody div#dpanel' );
		var $lb = $( '#tbtabbody .channelbutton-label.tbflash' );
		var dev = jQuery( 'select#devicemenu', $dp ).val() || "";
		var devnum = parseInt( dev );
		var sub = getCurrentSub();
		$lb.each( function() {
			var $bt = $(this).closest( '.channelbutton' );
			var ix = parseInt( $bt.attr('id').replace('channel','') ) - 1;
			if ( ix > sub.loads.length ) ix = sub.loads.length;
			if ( "" === dev ) {
				if ( ix < sub.loads.length && sub.loads[ix] ) {
					console.log("assignDevice: clearing channel " + ix);
					sub.loads.splice( ix, 1 );
					configModified = true;
				} else {
					console.log("assignDevice: unassign an unassigned channel " + ix);
				}
			} else {
				if ( ix < sub.loads.length && sub.loads[ix].device !== devnum ) {
					/* Existing assignment, changing device */
					console.log("assignDevice: reassign channel "+ix);
					sub.loads[ix].device = devnum;
					configModified = true;
				} else if ( ix >= sub.loads.length ) {
					/* New channel assignment */
					console.log("assignDevice: new channel "+ix);
					sub.loads[ix] = { device: devnum, level: 100 };
					configModified = true;
				} else {
					console.log("assignDevice: no change to channel " + ix);
				}
			}
		});
		saveConfiguration( false, function( st ) {
			/* If success, clear assign mode; otherwise stay in assign mode. */
			if ( st !== false ) {
				cancelAssign();
				loadSubmaster( getCurrentSubIndex() );
			}
		});
	}

	function handleAssignDeviceClick( ev ) {
		/* If any mode, ignore click */
		if ( ! inMimic() ) return;
		$("#tbtabbody").data('mode','assign').attr('data-mode','assign');

		var $dp = $( '#tbtabbody div#dpanel' );
		var sub = getCurrentSub();
		var $bt = $(ev.target).closest( ".channelbutton" );
		var $lb = $('.channelbutton-label', $bt);
		flash( $lb, true );
		$dp.empty().addClass("form-inline");
		var $mm = $( '<select>', { id: "devicemenu", class: "form-control form-control-sm" } );
		for ( var k=0; k<roomsByName.length; ++k ) {
			var r = roomsByName[k];
			var $group = false;
			for ( var j=0; j<r.devices.length; ++j ) {
				var d = r.devices[j];
				console.log(d.id + " " + d.name + " invis="+String(d.invisible) + " hidden="+String(d.hidden));
				/* NB Very specific test on invis/hidden (specific value no type constraint) */
				if ( sub.fader !== d.id && isDimmer( d.id, d ) && !( 1==d.invisible || 1==d.hidden ) ) {
					if ( ! $group ) {
						$group = $( '<optgroup>', { id: r.id, label: r.name } )
							.text( r.name )
							.appendTo( $mm );
					}
					$( '<option/>' ).val( d.id ).text( d.name ).appendTo( $group );
				}
			}
		}
		$('<option>').val("").text("(none)").prependTo( $mm );
		$mm.val("").appendTo( $dp );
		$('<button>', { id: "assigndevice", class: "btn btn-sm btn-primary" } )
			.text("Assign Device")
			.on( 'click', assignDevice )
			.appendTo( $dp );
		$('<button>', { id: "cancelassign", class: "btn btn-sm btn-default" } )
			.text("Cancel")
			.on( 'click', cancelAssign )
			.appendTo( $dp );
		$dp.show( "slow" );
		setMessages(['Assign Mode -- select device to assign to flashing channel']);
	}

	function endEdit() {
		saveConfiguration( false, function( st ) {
			$( 'div#tbtabbody' ).data('mode','').attr('data-mode','');
		});
		return true;
	}

	/* Edit current submaster. */
	function editSubmaster() {
		/* Make sure we're in mimic mode (no mode) */
		if ( ! inMimic() ) return;
		$bd = $( 'div#tbtabbody' );
		$bd.data('mode','edit').attr('data-mode', 'edit');

		var sub = getCurrentSub();

		$sel = $('.channelbutton.selected', $bd);
		if ( 1 === $sel.length ) {
			/* First item to edit selected. Set slider to configured level of
			   the selected channel. Set all other channels to their configured
			   values */
			ch = parseInt( $sel.attr( 'id' ).replace( 'channel', '' ) );
			$( '.subslider', $bd ).slider( "option", "value", sub.loads[ch-1].level );
			/* Set all channel buttons to their configured level */
			for ( var l=0; l<(sub.loads || []).length; ++l ) {
				var $cb = $( '#channel'+String(l+1), $bd );
				$cb.channelbutton( "option", "value", sub.loads[l].level );
				$( 'div.channelbutton-base', $cb ).attr( 'title', 'This is the programmed level of the device when the submaster fader is at 100%' );
			}
		} else if ( $sel.length > 0 ) {
			/* Multiple item selection. Set all items to current value of fader. */
			var n = $( '.subslider', $bd ).slider( "option", "value" );
			$sel.each( function() {
				$(this).channelbutton( "option", "value", n );
				$( 'div.channelbutton-base', $(this) ).attr( 'title', 'This is the programmed level of the device when the submaster fader is at 100%' );
				var ch = parseInt( $(this).attr( 'id' ).replace( 'channel', '' ) );
				if ( n !== sub.loads[ch-1].level ) {
					/* If different from config, save and mark modified */
					sub.loads[ch-1].level = n;
					configModified = true;
				}
			});
		}

		setMessages( [
			"Edit Mode -- slider sets highest level of selected channel (when fader at 100%)",
			"Select multiple channels with shift-click",
			"Click any selected channel to end editing and save changes",
			"There is no 'Undo'..."
			] );
	}

	/* Repaint the tab with submaster data. Should only be called from loadSubmaster() */
	function _loadSubmaster( subid ) {

		$bd.data('subindex', subid).attr('data-subindex', subid);
		var sub = getCurrentSub();

		var fv;
		if ( "" !== (sub.fader||"") ) {
			fv = api.getDeviceState( sub.fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" ) || 100;
		} else {
			fv = 100;
		}
		$( '.subslider', $bd ).data( 'fader', sub.fader ).attr( 'data-fader', sub.fader ).slider( "value", fv );
		for ( var l=1; l<=24; ++l ) {
			var $cb = $( '#channel'+l, $bd);
			$cb.removeClass( 'selected' );
			if ( l <= ( sub.loads || [] ).length ) {
				var ld = sub.loads[l-1];
				var cv = api.getDeviceState( ld.device, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" ) || 0;
				$cb.data( 'smload', String(ld.device) ).attr( 'data-smload', String(ld.device) );
				$cb.channelbutton( "option", "label", String(l) );
				$cb.channelbutton( "option", "value", cv );
				var devobj = api.getDeviceObject( ld.device );
				$( 'div.channelbutton-label', $cb ).attr( 'title', '#' +
					ld.device + " " +
					( devobj ? devobj.name : "(missing device)" ) +
					" (click to change)" );
				$( 'div.channelbutton-base', $cb ).attr( 'title', 'This is the current level of the device' ).removeClass('disabled');
			} else {
				$cb.removeData( 'smload' ).attr( 'data-smload', '' );
				$cb.channelbutton( "option", "label", "" );
				$cb.channelbutton( "option", "value", "" );
				$( 'div.channelbutton-label', $cb ).attr( 'title', 'Click to assign device' );
				$( 'div.channelbutton-base', $cb ).attr( 'title', 'No device assigned' ).addClass('disabled');
			}
		}

		var $inf = $("#tbsminfo", $bd).empty().addClass("form-inline");
		$( '<label id="lblsubname">Submaster: <input id="subname" type="text" class="form-control form-control-sm" title="Modify in place to edit name"></label>' ).appendTo( $inf );
		$( '<label id="lblsubfade">Fader: <select id="faderselect" class="form-control" title="Select submaster fader device" /></label>' ).appendTo( $inf );
		$( 'input#subname', $inf ).val(sub.id).on( 'change', function() {
			var newname = $(this).val() || "";
			var sub = getCurrentSub();
			if ( "" === newname ) {
				newname = String(getCurrentSubIndex());
			}
			if ( newname !== sub.id ) {
				sub.id = newname;
				configModified = true;
				saveConfiguration( false, function( st ) {
					if ( false == st ) {
						$(this).focus();
						return;
					}
					$("#tbtabs li#"+sub.__index).text( newname );
				});
			}
		});
		var $mm = $( 'select#faderselect', $inf );
		for ( var k=0; k<roomsByName.length; ++k ) {
			var r = roomsByName[k];
			var $group = false;
			for ( var j=0; j<r.devices.length; ++j ) {
				var d = r.devices[j];
				console.log(d.id + " " + d.name + " invis="+String(d.invisible) + " hidden="+String(d.hidden));
				if ( isDimmer( d.id, d ) && !( 1===d.invisible || 1===d.hidden ) ) {
					if ( ! $group ) {
						$group = $( '<optgroup>', { id: r.id, label: r.name } )
							.text( r.name )
							.appendTo( $mm );
					}
					$( '<option/>' ).val( d.id ).text( d.name ).appendTo( $group );
				}
			}
		}
		$('<option>').val("").text("(none)").prependTo( $mm );
		var opt = $('option[value="'+(sub.fader||"")+'"]', $mm);
		if ( 0 === opt.length ) {
			$('<option/>').val( sub.fader )
				.text( '(missing device #'+String(sub.fader)+')' )
				.prependTo( $mm );
		}
		$mm.val(sub.fader||"").on( 'change', function() {
			var sub = getCurrentSub();
			sub.fader = $(this).val();
			if ( "" !== sub.fader ) {
				sub.fader = parseInt( sub.fader );
			}
			saveConfiguration();
			loadSubmaster( getCurrentSubIndex() );
		});

		goMimic();
		$('#tbtabbody .subslider a').focus();
	}

	/* Removes all selections and updates panel to show sub in current state and config */
	function loadSubmaster( subid ) {
		$bd = $( 'div#tbtabbody' );

		/* If we're in assign mode, cancel */
		if ( inAssign() ) {
			cancelAssign();
		}

		/* If edit mode, attempt to save edits. If we suceed, go on to load new sub.
		   Otherwise, stay in edit mode on current sub. */
		if ( inEdit() ) {
			/* Take us out of editing mode */
			if ( configModified ) {
				saveConfiguration( false, function( st ) {
					/* Failed. Stay right where we are. */
					if ( false === st ) return;
					endEdit();
					/* Restore pre-edit slider value */
					$( '.subslider', $bd ).slider( "option", "value", faderValue );
					applySlider();
					/* Load new tab */
					_loadSubmaster( subid );
				});
				return;
			}
		}

		_loadSubmaster( subid );
	}

	function handleTabClick( ev ) {
		var $el = $(ev.currentTarget);
		var id = $el.attr('id');
		if ( "add" === id ) {
			addSubmaster();
		} else {
			$el.siblings().removeClass( 'selected' );
			$el.addClass( 'selected' );
			loadSubmaster( parseInt( id ) );
		}
	}

	function removeSubmasterTab( ix ) {
		$("#tbtabs ul li#"+ix).remove();
	}

	function deleteSubmaster( subIndex ) {
		var config = getConfiguration();
		var current = getCurrentSubIndex();
		if ( subIndex < config.subs.length ) {
			/* As always, removing the sub is the easy part... */
			removeSubmasterTab( subIndex );
			config.subs.splice( subIndex, 1 );
			/* ...fixing up everything else, though... */
			if ( subIndex < current ) {
				/* Deleted before current, so current has moved down */
				$("#tbtabbody").data("subindex", current-1).attr("data-subindex", current-1);
			}
			/* And everything from deleted position on needs to be renumbered */
			for ( var k=subIndex; k<config.subs.length; ++k ) {
				$("#tbtabs ul li#"+config.subs[k].__index).attr( 'id', k );
				config.subs[k].__index = k;
			}
			/* Save it */
			configModified = true;
			saveConfiguration();
			/* If deleted is current tab, select another tab. */
			if ( current == subIndex ) {
				if ( subIndex >= config.subs.length ) {
					/* Deleted the last tab, so back up one. */
					subIndex = config.subs.length - 1;
				}
				if ( subIndex < 0 ) {
					$('#tbtabs ul li#add').click();
				} else {
					$('#tbtabs ul li#'+subIndex).click();
				}
			}
		}
	}

	function insertSubmasterTab( ix, sub ) {
		var $tab = jQuery( '<li/>', { id: sub.__index, class: "tbtab" } )
			.text( sub.id )
			.on( 'click', handleTabClick);
		$('<i class="tabdelete material-icons md16">clear</i>')
			.on( 'click', function( event ) {
				if ( inEdit() || inAssign() ) return;
				var $tab = $(this).closest('li');
				var ix = parseInt( $tab.attr('id') );
				var config = getConfiguration();
				if ( event.shiftKey || confirm( 'Delete submaster "'+config.subs[ix].id+'"?') ) {
					deleteSubmaster( ix );
				}
			})
			.appendTo( $tab );
		$tab.insertBefore( '#tbtabs ul li#add' );
	}

	function addSubmaster() {
		if ( inEdit() || inAssign() ) return;

		var config = getConfiguration();
		var ix = config.subs.length;
		config.subs[ix] = { __index: ix, id: "Sub"+String(ix+1), loads: [] }; /* NB no fader */
		configModified = true;
		saveConfiguration();
		insertSubmasterTab( ix, config.subs[ix] );
		$('#tbtabs ul li#'+ix).click();
	}

	function _doConfiguration()
	{
		console.log("doConfiguration()");

		if ( configModified && confirm( msgUnsavedChanges ) ) {
			handleSaveClick( undefined );
		}

		if ( ! initModule() ) {
			return;
		}

		inStatusPanel = true;

		header();

		var html = '<div class="tbsubmasters submastertab">';
		html += '</div>'; /* div.submastertab */

		html += footer();

		html += '<div><b>TO-DO:</b> (the things I know about but haven\'t done yet):<br/><ul>\
<li>Copy sub to another</li>\
<li>Status display</li>\
<li>Isolate load on status display</li>\
</ul></div>';

		api.setCpanelContent( html );

		var $container = $( 'div.submastertab' );
		jQuery( '<script language="javascript">\
!function(t,e,i,l){t.widget("toggledbits.channelbutton",{options:{label:"",value:"",width:null,height:null,click:null,clickLabel:null,clickBase:null},_create:function(){this.element.addClass("channelbutton"),this.element.append(\'<div class="channelbutton-label">  <div class="channelbutton-label-slot"/>  <div class="channelbutton-label-text"/></div><div class="channelbutton-base">  <div class="channelbutton-base-slot"/>  <div class="channelbutton-value-text"/></div>\');var e=this;t("div.channelbutton-label",this.element).on("click",function(t,i){e.options.clickLabel&&e._clickLabel(t,e.element)}),t("div.channelbutton-base",this.element).on("click",function(t,i){e.options.clickLabel&&e._clickBase(t,e.element)}),this._refresh()},_refresh:function(){this.element.css("width",this.options.width||this.element.outerWidth),this.element.css("height",this.options.height||this.element.outerHeight),t("div.channelbutton-label-text",this.element).text(this.options.label).prop("disabled",!0),t("div.channelbutton-value-text",this.element).text(this.options.value).prop("disabled",!0)},_destroy:function(){},_clickLabel:function(e,i){$clicked=t(e.currentTarget),$clicked.hasClass("disabled")||$clicked.closest(".channelbutton").hasClass("disabled")||(this.options.clickLabel?this.options.clickLabel(e,i):this.options.click&&this._trigger("click",e,i))},_clickBase:function(e,i){$clicked=t(e.currentTarget),$clicked.hasClass("disabled")||$clicked.closest(".channelbutton").hasClass("disabled")||(this.options.clickBase?this.options.clickBase(e,i):this.options.click&&this._trigger("click",e,i))},_setOption:function(t,e){this.options[t]=e,this._super("_setOption",t,e),this._refresh()}})}(jQuery,window,document);\
</script>' ).appendTo( $container );

		var $th = jQuery( '<div/>', { id: "tbtabs" } ).appendTo( $container );
		jQuery( '<div style="float: none; clear: both"/>' ).appendTo( $container );

		var $body = jQuery( '<div/>', { id: "tbtabbody" } );
		jQuery( '<div/>', { id: "tbsminfo" } ).appendTo( $body );

		$body.append( '\
<div class="sliderblock"><img src="http://www.toggledbits.com/assets/submasters/slider-top.png"><div class="subslider" data-fader=""></div><img src="http://www.toggledbits.com/assets/submasters/slider-bottom.png"><div id="value">0</div></div>\
<div style="margin: 0 0; padding: 0 0; display: inline-block; vertical-align: top;">\
	<div class="r">\
		<div id="channel1" class="channel" data-smload=""></div>\
		<div id="channel2" class="channel" data-smload=""></div>\
		<div id="channel3" class="channel" data-smload=""></div>\
		<div id="channel4" class="channel" data-smload=""></div>\
		<div id="channel5" class="channel" data-smload=""></div>\
		<div id="channel6" class="channel" data-smload=""></div>\
		<div id="channel7" class="channel" data-smload=""></div>\
		<div id="channel8" class="channel" data-smload=""></div>\
	</div>\
	<div class="r">\
		<div id="channel9" class="channel" data-smload=""></div>\
		<div id="channel10" class="channel" data-smload=""></div>\
		<div id="channel11" class="channel" data-smload=""></div>\
		<div id="channel12" class="channel" data-smload=""></div>\
		<div id="channel13" class="channel" data-smload=""></div>\
		<div id="channel14" class="channel" data-smload=""></div>\
		<div id="channel15" class="channel" data-smload=""></div>\
		<div id="channel16" class="channel" data-smload=""></div>\
	</div>\
	<div class="r">\
		<div id="channel17" class="channel" data-smload=""></div>\
		<div id="channel18" class="channel" data-smload=""></div>\
		<div id="channel19" class="channel" data-smload=""></div>\
		<div id="channel20" class="channel" data-smload=""></div>\
		<div id="channel21" class="channel" data-smload=""></div>\
		<div id="channel22" class="channel" data-smload=""></div>\
		<div id="channel23" class="channel" data-smload=""></div>\
		<div id="channel24" class="channel" data-smload=""></div>\
	</div>\
</div>');
		$body.append( '<div id="status"></div>' );
		jQuery( '<div id="dpanel"/>' ).hide().appendTo( $body );

		$( ".subslider", $body ).slider({
			orientation: "vertical",
			min: 0,
			max: 100,
			value: faderValue,
			slide: function( event, ui ) {
				if ( fadeTimer ) {
					window.clearTimeout( fadeTimer );
				}
				handleSlider($(this));
				fadeTimer = window.setTimeout( applySlider, 500 );
			},
			start: function( event, ui ) {},
			stop: function( event, ui ) {
				if ( fadeTimer ) {
					window.clearTimeout( fadeTimer );
				}
				handleSlider($(this));
				applySlider();
			},
			change: function( event, ui ) { handleSlider($(this)); }
		});
		
		/* Special keyboard handling for slider handle */
		$( '.subslider a.ui-slider-handle', $body ).on( "keyup", function( event ) {
			var $sl = $(this).closest(".subslider");
			var val;
			if ( event.keyCode >= 48 && event.keyCode <= 57 ) {
				/* 0-9 sets level to 10x */
				$sl.slider( "value", ( event.keyCode - 48 ) * 10 );
			} else if ( "f" === event.key || "F" === event.key ) {
				/* "F" upper or lower sets level to full/100% */
				$sl.slider( "value", 100 );
			} else if ( "+" === event.key || "=" === event.key ) {
				/* "+" increases level (alt "=" is unshift "+" on US keyboards) */
				val = $sl.slider( "value" ) + ( event.shiftKey ? 10 : 5 );
				if ( val > 100 ) val = 100;
				$sl.slider( "value", val );
			} else if ( "-" === event.key || "_" === event.key ) {
				/* "-" decreates level (alt "_" is shift "-" on US keyboards) */
				val = $sl.slider( "value" ) - ( event.shiftKey ? 10 : 5 );
				if ( val < 0 ) val = 0;
				$sl.slider( "value", val );
			} else if ( event.keyCode == 32 ) {
				/* Space toggles on/off */
				val = $sl.slider( "value" );
				val = val > 0 ? 0 : 100;
				$sl.slider( "value", val );
			}
			applySlider();
		});

		$( '.channel', $body ).channelbutton({
			baseColor: '#fff',
			click: function( event, ui ) {},
			clickLabel: handleAssignDeviceClick,
			clickBase: function( event, ui ) {
				/* Only allow click in edit and mimic */
				if ( ! ( inMimic() || inEdit() ) ) return;
				ui.channelbutton("option","label", ui.attr('id').replace('channel',''));
				if ( ! event.shiftKey ) {
					$('.channel').not('#'+idSelector(ui.attr('id'))).removeClass( "selected" );
				}
				if ( ui.hasClass( "selected" ) ) {
					ui.removeClass( "selected" );
				} else {
					ui.addClass( "selected" );
				}
				clearSelection(); /* text selection creates UI grunge */
				var $sel = $('.channelbutton.selected');
				if ( $sel.length > 0 ) {
					editSubmaster();
				} else {
					loadSubmaster( getCurrentSubIndex() );
				}
				$('#tbtabbody .subslider a').focus();
			}
		});

		$container.append( $body );

		var config = getConfiguration();
		$th.append( '<ul/>' );
		$( '<li id="add"><i class="material-icons">add_circle_outline</i></li>' )
			.attr('title', 'Click to add submaster')
			.on( 'click', addSubmaster )
			.appendTo( $('ul', $th ) );
		for ( var k=0; k<(config.subs || []).length; k++ ) {
			insertSubmasterTab( k, config.subs[k] );
		}
		$( '#tbtabs ul li:first' ).click();

		api.registerEventHandler('on_ui_deviceStatusChanged', Submasters, 'onUIDeviceStatusChanged');
	}

	function doStatus() {
		try {
			_doStatus();
		} catch( e ) {
			console.log(e);
			if ( console && console.trace ) console.trace();
			debugger;
		}
	}

	function doConfiguration() {
		try {
			_doConfiguration();
		} catch( e ) {
			console.log(e);
			if ( console && console.trace ) console.trace();
			debugger;
		}
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
		doConfiguration: doConfiguration,
		doStatus: doStatus
	};

})(api, $ || jQuery);
