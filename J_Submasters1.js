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
	var inStatusPanel = false;
	var currentSub = 0;
	var isOpenLuup = false;
	// var isALTUI;

	var msgUnsavedChanges = "You have unsaved changes. Click OK to save them now, or cancel to discard them.";

	/* Insert the header items */
	function header() {
		var $head = $( 'head' );
		/* Load material design icons */
		//$head.append('<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');
		$head.append( '<script src="http://192.168.0.164/~patrick/toggledbits-channelbutton.js"></script>' );
		$head.append( '\
<style>\
	div.submastertab {} \
	div.submastertab .ui-slider { background-image: url(http://192.168.0.164/~patrick/slider-body.png); width: 75px; height: 180px; } \
	div.submastertab .ui-slider .ui-slider-handle { background: transparent url(http://192.168.0.164/~patrick/slider-handle.png) no-repeat scroll 100% 100%; width: 66px; height: 17px; border-style: none; } \
	div.submastertab .ui-slider .ui-corner-all,.ui-widget-content { border-style: none; border-radius: 0; } \
	div.submastertab .ui-slider a:active { border-style: none; text-decoration: none; } \
	div.submastertab div.channelbutton { width: 70px; height: 60px; margin: 0; padding: 0; text-align: center; } \
	div.submastertab div.channelbutton-label { border: 3px solid black; border-radius: 12px 12px 0px 0px; color: #000; width: 100%; height: 50%; display: block; background-color: #cff; } \
	div.submastertab div.channelbutton-label-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-label-text { font-size: 18px; font-weight: bold; font-family: OpenSansLight,Arial,sans-serif; line-height: 0.9em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab div.channelbutton-base { border: 3px solid black; border-radius: 0px 0px 12px 12px; color: #000; width: 100%; height: 50%; display: block; } \
	div.submastertab div.channelbutton-base-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-value-text { font-size: 12px; font-weight: bold; font-family: OpenSansLight,Arial,sans-serif; line-height: 0.9em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab .channel { float: left !important; margin: 0 10px 14px 0 !important; } \
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
			var s = api.getDeviceState( myid, serviceId, "Configuration", { dynamic: false } );
			try {
				d.config = JSON.parse( s );
			} catch (e) {
				d.config = false;
			}
		} else {
			console.log("getConfiguration(): returning cached config serial " + String(d.config.serial));
		}
		return d.config;
	}

/** ***************************************************************************
 *
 * C O N F I G U R A T I O N
 *
 ** **************************************************************************/

	var fadeTimer = null;

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

	function toggleFlash( $b ) {
		var f = $b.channelbutton( "flash" );
		$b.channelbutton( "flash", ! f );
	}

	function tickSlide() {
		console.log("TICK");
		var ui = $( 'div#tbtabbody #slider' );
		var val = ui.slider("value");
		fadeTimer = null;
		if ( 0 === $('.channel.selected').length ) {
			faderValue = val;
			var fader = getConfiguration().subs[currentSub].fader;
			api.performActionOnDevice( fader, "urn:upnp-org:serviceId:Dimming1", "SetLoadLevelTarget", {
				actionArguments: { newLoadlevelTarget: val },
				onSuccess: function( xhr ) {
					console.log("performActionOnDevice.onSuccess: " + String(xhr));
				},
				onFailure: function( xhr ) {
					//??? are there undocumented parameters here?
					if (typeof(xhr)==="object") {
						for ( var k in xhr ) {
							if ( xhr.hasOwnProperty(k) )
								console.log("xhr." + k + "=" + String(xhr[k]));
						}
					}
					alert( "An error occurred. Try again in a moment; Vera may be busy." );
				}
			} );
		}
	}

	function updateFaderValue( ui ) {
		var val = ui.slider("value");
		$('#value').text( val );
		var cbs = $('.channel.selected');
		if ( 0 === cbs.length ) {
			/* No channels selected, treat as sub fader */
			faderValue = val;
		} else {
			/* Channel(s) selected; assign fader value to channel */
			cbs.each( function() {
				jQuery(this).channelbutton("option", "value", val );
				// ??? configuration changes here
			});
		}
	}

	function onUIDeviceStatusChanged( args ) {
		if ( !inStatusPanel ) {
			return;
		}
		var pdev = api.getCpanelDeviceId();
		var doUpdate = false;
		var k;
		if ( args.id == pdev ) {
			for ( k=0; k<(args.states || []).length; ++k ) {
				if ( args.states[k].service === serviceId &&
						args.states[k].variable.match( /^(cdata|cstate|Tripped|Armed)$/ ) )
				{
					doUpdate = true;
					break;
					// console.log( args.states[k].service + '/' + args.states[k].variable + " updated!");
				}
			}
			if ( doUpdate ) {
				try {
					updateStatus( pdev );
				} catch (e) {
					console.log( e );
					console.log( e.stack );
				}
			}
		} else {
			/* Update channel values, if no channels are selected (edit mode) */
			if ( $('.channel.selected').length > 0 ) return;
			var ch = $( '.channelbutton[data-smload="'+args.id+'"]' );
			if ( ch.length ) {
				for ( k=0; k<(args.states || []).length; ++k ) {
					if ( args.states[k].service === "urn:upnp-org:serviceId:Dimming1" &&
							args.states[k].variable === "LoadLevelStatus" ) {
						var val = args.states[k].value;
						ch.each( function() {
							var $el = $(this);
							$el.channelbutton( "option", "value", val );
						});
					}
				}
			}
		}
	}

	/* Removes all selections and updates panel to show sub in current state and config */
	function loadSubmaster( subid ) {
		var config = getConfiguration();
		config = config.subs[subid];

		$bd = $( 'div#tbtabbody' );

		var fv = api.getDeviceState( config.fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" ) || 0;
		$( '#slider' ).slider( "value", fv );
		for ( var l=1; l<=24; ++l ) {
			var $cb = $( '#channel'+l, $bd);
			$cb.removeClass( 'selected' );
			if ( l <= ( config.loads || [] ).length ) {
				var ld = config.loads[l-1];
				var cv = api.getDeviceState( ld.device, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" ) || 0;
				$cb.data( 'smload', String(ld.device) ).attr( 'data-smload', String(ld.device) );
				$cb.channelbutton( "option", "label", String(l) );
				$cb.channelbutton( "option", "value", cv );
				$( 'div.channelbutton-label', $cb ).attr( 'title', '#' + ld.device + " (click to change)" );
			} else {
				$cb.removeData( 'smload' ).attr( 'data-smload', '' );
				$cb.channelbutton( "option", "label", "" );
				$cb.channelbutton( "option", "value", "" );
				$( 'div.channelbutton-label', $cb ).attr( 'title', 'Click to assign device' );
			}
		}
	}

	function doConfiguration()
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

		var html = '<div class="submastertab">';
		html += '</div>'; /* div.submastertab */

		html += footer();

		api.setCpanelContent( html );

		var $container = $( 'div.submastertab' );
		var $body = jQuery( '<div/>', { id: "tbtabbody" } );
		$body.append( '\
<div style="margin: 0 0; padding: 0 0; display: inline-block; vertical-align: top;"><img src="http://192.168.0.164/~patrick/slider-top.png"><div id="slider"></div><img src="http://192.168.0.164/~patrick/slider-bottom.png"><div id="value">0</div></div>\
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

		$( "#slider", $body ).slider({
			orientation: "vertical",
			min: 0,
			max: 100,
			value: 0, // ??? was faderValue
			slide: function( event, ui ) {
				$('#status').append(" slide");
				if ( fadeTimer ) {
					clearTimeout( fadeTimer );
				}
				fadeTimer = window.setTimeout( tickSlide, 1000 );
				updateFaderValue($(this));
			},
			start: function( event, ui ) { $('#status').append(" start"); },
			stop: function( event, ui ) { $('#status').append(" stop"); },
			change: function( event, ui ) { $('#status').append(" change"); updateFaderValue($(this)); }
		});

		$( '.channel', $body ).channelbutton({
			baseColor: '#fff',
			click: function( event, ui ) { $('#status').append( " button.click" ); },
			clickLabel: function( event, ui ) { $('#status').append( " button.clickLabel" ); toggleFlash( ui ); },
			clickBase: function( event, ui ) {
				$('#status').append( " button.clickBase" );
				ui.channelbutton("option","label", ui.attr('id').replace('channel',''));
				if ( ! event.shiftKey ) {
					$('.channel').not('#'+idSelector(ui.attr('id'))).removeClass( "selected" ).channelbutton("option", "baseColor", "#fff");
				}
				if ( ui.hasClass( "selected" ) ) {
					ui.removeClass( "selected" ).channelbutton("option","baseColor",'#fff');
				} else {
					ui.addClass( "selected" ).channelbutton("option","baseColor",'#0f8');
				}
				clearSelection();
				var sel = $('.channelbutton.selected');
				if ( sel.length == 1 ) {
					$('#slider').slider("value", sel.channelbutton("option", "value"));
				} else if ( sel.length == 0 ) {
					loadSubmaster( currentSub );
				}
				$('#slider a').focus();
			}
		});

		$container.append( $body );

		loadSubmaster( currentSub );

		api.registerEventHandler('on_ui_deviceStatusChanged', Submasters, 'onUIDeviceStatusChanged');
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
		doConfiguration: doConfiguration
	};

})(api, $ || jQuery);
