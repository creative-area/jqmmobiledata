$(function() {

	// Make sure the footer will not disapear on click
	//$( "#origami" ).click( false );
	$( "#origami" ).bind( "tap", function() {
		return false;
	});

	var // Format or origamiCount cells
		format = {
			number: function( value ) {
				return value || "-";
			},
			hour: function( value ) {
				return value ? ( value + "h" ) : "-";
			},
			halfHour: function( value ) {
				if ( !value ) {
					return "-";
				}
				var hour = Math.floor( value ),
					minute = value - hour;
				return hour + "h" + ( minute ? "30" : "00" );
			}
		},
		// Units used in origami-bandwidth data
		units = {
			K: 1,
			M: 1000
		},
		// regexp to parse origami-bandwidth data
		r_bandwidth = /^([0-9]+)(K|M)$/,
		// Get the origamiCount cells
		data = $( ".origami-count" ).each(function() {
			var elem = $( this ),
				bandwidth = elem.attr( "data-origami-bandwidth" ),
				tmp = r_bandwidth.exec( bandwidth );
			// toggle from bandwidth expression to actual value
			elem.attr( "data-origami-bandwidth", tmp[ 1 ] * units[ tmp[ 2 ] ] );
			// bind plus and minus actions
			elem.siblings( ".origami-plus" ).bind( "tap", updateValue( elem, +1 ) );
			elem.siblings( ".origami-minus" ).bind( "tap", updateValue( elem, -1 ) );
		}),
		// Get the result span
		result = $( "#origami-result" );

	// utility function that returns a click (mousedown) handler
	function updateValue( elem, direction ) {
		console.log("touchstart");
		var timer,
			lastTimeout;
		return function simulate() {
			var self = this,
				// Get current value
				current = 1 * ( elem.attr( "data-origami-value" ) || 0 ),
				// ... and increment
				increment = elem.attr( "data-origami-increment" );
			// Apply the change
			current += direction * increment;
			// If we're still in bounds
			if ( current >= 0 && current <= elem.attr( "data-origami-max" ) ) {
				// Install mouseup control & timer for fast up & down
				if ( !timer ) {
					lastTimeout = 1000;
					$( self ).one( "mouseup mouseout touchend", function() {
						clearTimeout( timer );
						timer = lastTimeout = undefined;
					});
				}
				lastTimeout /= 2;
				if ( lastTimeout < 80 ) {
					lastTimeout = 80;
				}
				timer = setTimeout(function() {
					simulate.call( self );
				}, lastTimeout );
				// Update value & display
				elem.attr( "data-origami-value", current );
				elem.text( format[ elem.attr( "data-origami-format" ) ]( current ) );
				// Update global count
				updateCount();
			}
		};
	}

	// Function to update the global count
	function updateCount() {
		var cumul = 0;
		data.each(function() {
			var elem = $( this );
			cumul += ( elem.attr( "data-origami-value" ) || 0 ) * elem.attr( "data-origami-bandwidth" );
		});
		cumul = !cumul ? 0 : ( cumul < 1000 ? "< 1" : Math.ceil( cumul / 1000 ) );
		result.text( cumul + " Mo par mois" );
	}
});