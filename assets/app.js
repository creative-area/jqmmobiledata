$(function() {

	// Make sure the footer will not disappear on click
	$( "#origami" ).click( false );

	var // Determine proper gesture events
		supportTouch = $.support.touch,
		touchStart = supportTouch ? "touchstart" : "mousedown",
		touchEnd = supportTouch ? "touchend" : "mouseup",
		// Format of origamiCount cells
		format = {
			number: function( value ) {
				return value;
			},
			hour: function( value ) {
				return value + "h";
			},
			halfHour: function( value ) {
				var hour = Math.floor( value ),
					minute = value - hour;
				return hour + "h" + ( minute ? "30" : "00" );
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
		result = $( "#origami-result" ),
		values = [];

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
		if ( cumul ) {
			cumul = cumul < 1000 ? "< 1" : Math.ceil( cumul / 1000 );
		}
		result.text( cumul + " Mo par mois" );
	}

	// Bind the buttons actions
	$( ".origami-count" ).each(function( index ) {
		var // Get the element
			elem = $( this ),
			data = elem.data(),
			// Starting value (and corresponding value in global array)
			value = values[ index ] = 0,
			// Get increment step
			increment = 1 * data.origamiIncrement,
			// Get maximum value
			max = 1 * data.origamiMax,
			// Get bandwidth contribution (see lower for final value)
			bandwidth = r_bandwidth.exec( data.origamiBandwidth ),
			// Get formatting function
			formatFN = format[ data.origamiFormat ],
			// Get plus button
			plusButton = elem.siblings( ".origami-plus" ),
			// Get minus button
			minusButton = elem.siblings( ".origami-minus" ),
			// Timer variables (hold behavior)
			timer,
			timeout;
		// Compute final bandwidth contribution value
		bandwidth = bandwidth[ 1 ] * units[ bandwidth[ 2 ] ];
		// Returns an handler for button click given the direction (+1/-1)
		function dirUpdate( direction ) {
			return function update() {
				var // Test change
					current = value + direction * increment;
				// If we can change the value
				if ( current >= 0 && current <= max ) {
					// Update local and global value;
					values[ index ] = (( value = current )) * bandwidth;
					// Update local display
					elem.text( current ? formatFN( current ) : "-" );
					// Update total display
					updateTotal();
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
				// If we can't change the value, stop anything related to holding
				} else {
					end();
				}
				// Make sure we don't start selecting text
				// (very annoying otherwise)
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