$(function() {

	// Make sure the footer will not disappear on click
	$( "#app" ).bind( "tap", false );

	var // Determine proper gesture events
		supportTouch = $.support.touch,
		touchStart = supportTouch ? "touchstart" : "mousedown",
		touchEnd = supportTouch ? "touchend" : "mouseup",
		// Format of appCount cells
		format = {
			number: function( value ) {
				return value;
			},
			hour: function( value ) {
				return value + "h";
			},
			hourMinute: function( value ) {
				var hour = Math.floor( value ),
					minute = Math.floor( 60 * ( value - hour ) );
				if ( minute < 10 ) {
					minute = "0" + minute;
				}
				return hour + "h" + minute;
			}
		},
		// Mask handling
		mask = {
			number: function( setValue ) {
				return function( event ) {
					setValue( parseFloat( $.trim( this.value ) ), event.type === "blur" );
				};
			},
			hourMinute: function( setValue ) {
				return function( event ) {
					var val = this.value.split( "h" ),
						hour = parseFloat( $.trim( val[ 0 ] ) ),
						minute = val[ 1 ] ? parseFloat( $.trim( val[ 1 ] ) ) : 0;
					setValue( hour + ( minute / 60 ), event.type === "blur" );
				};
			}
		},
		// Units used in bandwidth data
		units = {
			K: 1,
			M: 1000
		},
		// Regular expression to parse bandwidth data
		r_bandwidth = /^([0-9]+)(K|M)$/,
		// Get the result span
		result = $( "#app-result" ),
		values = [],
		// Flag to know if we got passed the 2GO limit
		over2GO;

	// Make hour the same as halfHour for masks
	mask.hour = mask.hourMinute;

	// Function to update the global count
	function updateTotal() {
		var cumul = 0,
			i = 0,
			length = values.length;
		// We re-compute every time rather than maintain a global variable
		// to account for eventual rounding errors when adding/subtracting
		// multiple times to the same variable in JavaScript
		for( ; i < length; i++ ) {
			cumul += values[ i ];
		}
		over2GO = ( cumul >= 2000000 );
		if ( over2GO ) {
			cumul = 2000000;
		}
		if ( cumul ) {
			if ( cumul < 1000 ) {
				cumul = "< 1 Mo";
			} else if ( cumul >= 1000000 ) {
				cumul = ( cumul / 1000000 ).toFixed( 2 ) + " Go";
			} else {
				cumul = Math.ceil( cumul / 1000 ) + " Mo";
			}
		}
		result.text( cumul + " par mois" );
	}

	// Bind the buttons actions
	$( ".app-count" ).each(function( index ) {
		var // Get the element
			elem = $( this ),
			data = elem.data(),
			// Starting value (and corresponding value in global array)
			value = values[ index ] = 0,
			// Get increment step
			increment = 1 * data.appIncrement,
			// Get maximum value
			max = 1 * data.appMax,
			// Get bandwidth contribution (see lower for final value)
			bandwidth = r_bandwidth.exec( data.appBandwidth ),
			// Get formatting function
			formatFN = format[ data.appFormat ],
			// Get masking function
			maskFN = mask[ data.appFormat ]( setValue ),
			// Get control panel
			controlPanel = elem.siblings( ".app-control-panel" ),
			// Get plus button
			plusButton = $( ".app-plus", controlPanel ),
			// Get minus button
			minusButton = $( ".app-minus", controlPanel ),
			// Timer variables (hold behavior)
			timer,
			timeout;
		// Mask input
		elem.bind( "keyup blur", maskFN );
		// Empty field on focus if value is "-"
		elem.bind( "focus", function() {
			if ($(this).val() === "-") {
				$(this).val("");
			}
		} );
		// Compute final bandwidth contribution value
		bandwidth = bandwidth[ 1 ] * units[ bandwidth[ 2 ] ];
		// Set value
		function setValue( current, dynamic ) {
			var ok;
			if( isNaN( current ) ) {
				current = value;
			} else {
				if ( current / increment > Math.floor( current / increment ) ) {
					current = ( Math.floor( current / increment ) + 1 ) * increment;
				}
				ok = current >= 0 && current <= max;
			}
			if ( dynamic !== undefined || ok ) {
				if ( current < 0 ) {
					current = 0;
				} else if ( current > max ) {
					current = max;
				}
				if ( !over2GO || current <= value ) {
					values[ index ] = (( value = current )) * bandwidth;
				}
				if ( dynamic !== false ) {
					// Update local display
					elem.val( value ? formatFN( value ) : "-" );
				}
				// Update total display
				updateTotal();
			}
			// Say if there was a change
			return ok;
		}
		// Returns an handler for button click given the direction (+1/-1)
		function dirUpdate( direction ) {
			return function update() {
				if ( setValue( value + direction * increment ) ) {
					// Hold timer
					if ( timer ) {
						timeout /= 2;
						if ( timeout < 80 ) {
							timeout = 80;
						}
					} else {
						timeout = 1000;
					}
					timer = setTimeout( update, timeout );
				} else {
					end();
				}
				return false;
			};
		}
		// Handler to clear all holding timers when touch action ends
		function end() {
			if ( timer ) {
				clearTimeout( timer );
				timer = timeout = undefined;
			}
		}
		// Bind update handler to buttons given direction
		plusButton.bind( touchStart, dirUpdate( +1 ) );
		minusButton.bind( touchStart, dirUpdate( -1 ) );
		// Bind end of touch action handler for both buttons
		// and also make sure getting out of the button while
		// holding touch properly cancels everything
		// (same for cancel)
		plusButton.add( minusButton ).bind( touchEnd, end ).bind( "vmouseout vmousecancel", function() {
			$( this ).trigger( touchEnd );
		});
	});
});