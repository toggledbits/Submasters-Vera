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
	var isOpenLuup = false;
	// var isALTUI;
	var roomsByName = [];
	var iData = [];
	var configModified = false;
	var inStatusPanel = false;
	var currentSub = 0;
	var fadeTimer = null;
	var faderValue = 100;

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
	div.submastertab div.channelbutton { width: 80px; height: 80px; margin: 0; padding: 0; text-align: center; } \
	div.submastertab div.channelbutton-label { border: 3px solid black; border-bottom: none; border-radius: 12px 12px 0px 0px; color: #000; width: 100%; height: 40%; display: block; background-color: #cff; } \
	div.submastertab div.channelbutton-label.disabled { cursor: not-allowed; } \
	div.submastertab div.channelbutton-label-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-label-text { font-size: 18px; font-weight: bold; font-family: OpenSansLight,Arial,sans-serif; line-height: 0.9em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab div.channelbutton-base { border: 3px solid black; border-radius: 0px 0px 12px 12px; color: #000; width: 100%; height: 60%; display: block; } \
	div.submastertab div.channelbutton-base.disabled { cursor: not-allowed; } \
	div.submastertab div.channelbutton-base-slot { height: 100%; width: 1px; display: inline-block; vertical-align: middle; } \
	div.submastertab div.channelbutton-value-text { font-size: 14px; font-weight: bold; line-height: 1.15em; display: inline-block; position: relative; vertical-align: middle; } \
	div.submastertab .channel { float: left !important; margin: 2px 3px 3px 2px !important; } \
	div.submastertab div#value { width: 75px; text-align: center; font-family: monospace; font-size: 24px; font-weight: bold; } \
	div.submastertab div#status { width: 100%; overflow: hidden; padding: 2px 8px; background-color: #000; color: rgb(0,224,0); font-family: monospace; font-size: 18px; font-weight: normal; } \
	div.submastertab div#tbtabs { margin: 0; padding: 0; background-color: #eee; } \
	div.submastertab div#tbtabs ul { margin: 0; padding: 8px 0 0 0; } \
	div.submastertab div#tbtabs li { list-style: none; float: left; position: relative; top: 0px; border: none: none; padding: 4px 8px; border-radius: 8px 8px 0 0; text-align: center; background-color: rgb(246,246,246); } \
	div.submastertab div#tbtabs li:hover { cursor: pointer; background-color: rgb(192,192,192); } \
	div.submastertab div#tbtabs li:active { cursor: pointer; border-color: rgb(0,127,255); } \
	div.submastertab div#tbtabs li.selected { background-color: rgb(0,127,255); color:white; } \
	div.submastertab div#tbtabbody { background-color: #fff; padding: 8px; } \
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
			var noroom = { "id": 0, "name": "No Room", "devices": [] };
			var rooms = [ noroom ];
			var roomIx = {};
			roomIx[String(noroom.id)] = noroom;
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
			clearTimeout( messageTimer );
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
					alert( "An error occurred. Try again in a moment; Vera may be busy." );
				}
			} );
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
			var config = getConfiguration().subs[currentSub];
			cbs.each( function() {
				jQuery(this).channelbutton("option", "value", val );
				var ch = parseInt( $(this).attr( 'id' ).replace( 'channel', '' ) );

				config.loads[ch-1].level = val;
				configModified = true;
			});
		}
	}

	function onUIDeviceStatusChanged( args ) {
		if ( !inStatusPanel ) {
			return;
		}
		var pdev = api.getCpanelDeviceId();
		var k;
		if ( args.id == pdev ) {
			// nada
		} else {
			/* No changes if channels are selected (editing) */
			if ( $('.channel.selected').length > 0 ) return;

			/* Fader change? */
			var $ff = $( '#tbtabbody #slider[data-fader="'+args.id+'"]' );
			if ( $ff.length > 0 ) {
				for ( k=0; k<(args.states || []).length; k++ ) {
					if ( args.states[k].service == "urn:upnp-org:serviceId:Dimming1" &&
							args.states[k].variable === "LoadLevelStatus" ) {
						$ff.slider( "option", "value", args.states[k].value );
						break;
					}
				}
			}

			/* Update channel values */
			var $ch = $( '.channelbutton[data-smload="'+args.id+'"]' );
			if ( $ch.length > 0 ) {
				for ( k=0; k<(args.states || []).length; ++k ) {
					if ( args.states[k].service === "urn:upnp-org:serviceId:Dimming1" &&
							args.states[k].variable === "LoadLevelStatus" ) {
						var val = args.states[k].value;
						$ch.each( function() {
							$(this).channelbutton( "option", "value", val );
						});
						break;
					}
				}
			}
		}
	}
	
	function handleAssignDeviceClick( ev ) {
		var $dp = $( '#tbtabbody div#dpanel' );
		$dp.empty().addClass("form-inline");
		var $mm = $( '<select>', { id: "devicemenu", class: "form-control form-control-sm" } );
		for ( var k=0; k<roomsByName.length; ++k ) {
			var $group = $( '<optgroup>', { id: roomsByName[k].id, label: roomsByName[k].name } )
				.text( roomsByName[k].name )
				.appendTo( $mm );
			for ( var j=0; j<roomsByName[k].devices.length; ++j ) {
				$( '<option/>' ).val( roomsByName[k].devices[j].id )
				.text( roomsByName[k].devices[j].name )
				.appendTo( $group );
			}
		}
		$('<option>').val("").text("--choose device--").prependTo( $mm );
		$mm.appendTo( $dp );
		$('<button>', { id: "assigndevice", class: "btn btn-sm btn-primary" } ).text("Assign Device")
			.on( 'click', function() { alert("TBD"); } )
			.appendTo( $dp );
		$dp.slideDown();
	}

	function inEdit() {
		return $('#tbtabbody').hasClass( 'tbedit' );
	}

	function endEdit() {
		if ( configModified ) {
			var myid = api.getCpanelDeviceId();
			var config = getConfiguration( myid );
			config.serial = ( config.serial || 0 ) + 1;
			config.timestamp = new Date().getTime() / 1000;
			api.setDeviceStatePersistent( myid, serviceId, "Configuration",
				JSON.stringify( config, function( k, v ) { return k.match( /^__/ ) ? undefined : v; } ),
				{
					'onSuccess' : function() {
						configModified = false;
						$( 'div#tbtabbody' ).removeClass( 'tbedit' );
					},
					'onFailure' : function() {
						alert('There was a problem saving the modified configuration. Vera/Luup may be restarting. Please try again.');
					}
				}
			);
		}
		return true;
	}

	/* Removes all selections and updates panel to show sub in current state and config */
	function editSubmaster( subid ) {
		var config = getConfiguration();
		var sub = config.subs[subid];

		$bd = $( 'div#tbtabbody' );
		$sel = $('.channelbutton.selected', $bd);
		if ( 1 === $sel.length ) {
			/* First item to edit selected. Set slider to configured level of
			   the selected channel. Set all other channels to their configured
			   values */
			$bd.addClass( 'tbedit' );
			ch = parseInt( $sel.attr( 'id' ).replace( 'channel', '' ) );
			$( '#slider', $bd ).slider( "option", "value", sub.loads[ch-1].level );
			/* Set all channel buttons to their configured level */
			for ( var l=0; l<(sub.loads || []).length; ++l ) {
				var $cb = $( '#channel'+String(l+1), $bd );
				$cb.channelbutton( "option", "value", sub.loads[l].level );
				$( 'div.channelbutton-base', $cb ).attr( 'title', 'This is the programmed level of the device when the submaster fader is at 100%' );
			}
		} else if ( $sel.length > 0 ) {
			/* Multiple item selection. Set all items to current value of fader. */
			var n = $( '#slider', $bd ).slider( "option", "value" );
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

	/* Removes all selections and updates panel to show sub in current state and config */
	function loadSubmaster( subid ) {
		$bd = $( 'div#tbtabbody' );

		if ( inEdit() ) {
			/* Take us out of editing mode */
			if ( ! endEdit() ) return;
			$( '#slider', $bd ).slider( "option", "value", faderValue );
			applySlider();
		}

		var config = getConfiguration();
		var sub = config.subs[subid];

		var fv = api.getDeviceState( sub.fader, "urn:upnp-org:serviceId:Dimming1", "LoadLevelStatus" ) || 0;
		$( '#slider', $bd ).data( 'fader', sub.fader ).attr( 'data-fader', sub.fader ).slider( "value", fv );
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

		setMessages( [
			"Mimic Mode -- slider controls submaster fader",
			"Channel buttons show current intensity of each assigned load",
			"Click a channel header to set/change assigned device",
			"Click a channel intensity to change level"
		] );
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

		var html = '<div class="submastertab">';
		html += '</div>'; /* div.submastertab */

		html += footer();

		api.setCpanelContent( html );

		var $container = $( 'div.submastertab' );
		var $th = jQuery( '<div/>', { id: "tbtabs" } ).appendTo( $container );
		jQuery( '<div class="ui-helper-clearfix"/>' ).appendTo( $container );
		
		var $body = jQuery( '<div/>', { id: "tbtabbody" } );
		$body.append( '\
<div style="margin: 0 0; padding: 0 0; display: inline-block; vertical-align: top;"><img src="http://192.168.0.164/~patrick/slider-top.png"><div id="slider" data-fader=""></div><img src="http://192.168.0.164/~patrick/slider-bottom.png"><div id="value">0</div></div>\
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

		$( "#slider", $body ).slider({
			orientation: "vertical",
			min: 0,
			max: 100,
			value: faderValue,
			slide: function( event, ui ) {
				if ( fadeTimer ) {
					clearTimeout( fadeTimer );
				}
				handleSlider($(this));
				fadeTimer = window.setTimeout( applySlider, 500 );
			},
			start: function( event, ui ) {},
			stop: function( event, ui ) {
				if ( fadeTimer ) {
					clearTimeout( fadeTimer );
				}
				handleSlider($(this));
				applySlider();
			},
			change: function( event, ui ) { handleSlider($(this)); }
		});

		$( '.channel', $body ).channelbutton({
			baseColor: '#fff',
			click: function( event, ui ) {},
			clickLabel: handleAssignDeviceClick,
			clickBase: function( event, ui ) {
				ui.channelbutton("option","label", ui.attr('id').replace('channel',''));
				if ( ! event.shiftKey ) {
					$('.channel').not('#'+idSelector(ui.attr('id'))).removeClass( "selected" ).channelbutton("option", "baseColor", "#fff");
				}
				if ( ui.hasClass( "selected" ) ) {
					ui.removeClass( "selected" ).channelbutton("option","baseColor",'#fff');
				} else {
					ui.addClass( "selected" ).channelbutton("option","baseColor",'#0f8');
				}
				clearSelection(); /* text selection creates UI grunge */
				var $sel = $('.channelbutton.selected');
				if ( $sel.length > 0 ) {
					editSubmaster( currentSub );
				} else {
					loadSubmaster( currentSub );
				}
				$('#tbtabbody #slider a').focus();
			}
		});

		$container.append( $body );
		
		var config = getConfiguration();
		$th.append( '<ul/>' );
		for ( var k=0; k<(config.subs || []).length; k++ ) {
			var $tab = jQuery( '<li/>', { id: k, class: "tbtab" } );
			$tab.text( config.subs[k].id );
			$tab.on( 'click', function( event, ui ) {
				var $el = $(event.target);
				$(this).siblings().removeClass( 'selected' );
				$(this).addClass( 'selected' );
				loadSubmaster( parseInt( $(this).attr('id') ) );
			});
			$( 'ul', $th ).append( $tab );
		}
		$( '#tbtabs ul li#' + idSelector( currentSub ) ).click();

		loadSubmaster( currentSub );

		api.registerEventHandler('on_ui_deviceStatusChanged', Submasters, 'onUIDeviceStatusChanged');
	}

	function doConfiguration() {
		try {
			_doConfiguration();
		} catch( e ) {
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
		doConfiguration: doConfiguration
	};

})(api, $ || jQuery);
