import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #eaeaea',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#4b5563',
    marginRight: 10,
    fontSize: 12,
  },
  value: {
    color: '#1f2937',
    fontSize: 12,
  },
  total: {
    marginTop: 20,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4b5563',
    marginRight: 10,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#047857',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1 solid #eaeaea',
    paddingTop: 20,
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '3 8',
    borderRadius: 4,
    fontSize: 10,
    marginLeft: 5,
    alignSelf: 'center',
  },
  divider: {
    borderBottom: '1 solid #e5e7eb',
    marginTop: 8,
    marginBottom: 8,
  },
  hotelSection: {
    margin: 10,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdfa',
  },
  amenityBox: {
    backgroundColor: '#e0f2fe',
    padding: 5,
    borderRadius: 3,
    margin: '2 2',
  },
  amenityText: {
    fontSize: 10,
    color: '#0369a1',
  },
  amenityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 5,
  },
  
  // Add new styles for flight sections
  outboundSection: {
    borderLeft: '3 solid #3b82f6',
    paddingLeft: 10,
    marginBottom: 10,
  },
  returnSection: {
    borderLeft: '3 solid #10b981',
    paddingLeft: 10,
  },
  flightTypeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 5,
  },
  flightSeparator: {
    borderStyle: 'dashed',
    borderBottom: '1 dashed #e5e7eb',
    marginVertical: 5,
  },
});

// Create Document Component
const TripInvoicePDF = ({ tripDetails, transactionId, paymentMethod, userData, totalAmount, searchResults }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const currentDate = formatDate(new Date().toISOString());
  
  // Format check-in and check-out dates if available
  const checkIn = tripDetails.hotel?.checkIn ? formatDate(tripDetails.hotel.checkIn) : formatDate(tripDetails.flight?.departureTime);
  const checkOut = tripDetails.hotel?.checkOut ? formatDate(tripDetails.hotel.checkOut) : formatDate(tripDetails.flight?.arrivalTime);
  
  // Hotel amenities (if available)
  const hotelAmenities = tripDetails.hotel?.amenities || [];
  
  // Enhanced round trip detection that properly respects trip type
const isRoundTrip = (() => {
  // First, check explicit trip type indicators
  if (tripDetails.flight?.tripType === "ONE_WAY" || tripDetails.flight?.tripType === "ONEWAY") {
    console.log("Trip PDF - Explicitly marked as ONE_WAY");
    return false;
  }
  
  if (tripDetails.flight?.tripType === "ROUNDTRIP" || searchResults?.tripType === "RETURN") {
    console.log("Trip PDF - Explicitly marked as ROUNDTRIP/RETURN");
    return true;
  }
  
  // If no explicit type is set, check if return flight data exists
  const hasReturnFlightData = 
    (tripDetails.flight?.returnDepartureTime && tripDetails.flight?.returnArrivalTime) ||
    (tripDetails.flight?.returnDeparture && tripDetails.flight?.returnArrival) ||
    (tripDetails.flight?.segments && tripDetails.flight.segments.length > 1);
    
  console.log("Trip PDF - Return flight data exists:", hasReturnFlightData);
  return Boolean(tripDetails.flight?.isRoundTrip || hasReturnFlightData);
})();

  console.log("Trip PDF - Round Trip Detection:", { 
    isRoundTripFlag: tripDetails.flight?.isRoundTrip,
    tripType: tripDetails.flight?.tripType,
    searchResultsTripType: searchResults?.tripType,
    hasReturnTimes: !!(tripDetails.flight?.returnDepartureTime && tripDetails.flight?.returnArrivalTime),
    hasReturnLocations: !!(tripDetails.flight?.returnDeparture && tripDetails.flight?.returnArrival),
    hasMultipleSegments: !!(tripDetails.flight?.segments && tripDetails.flight.segments.length > 1),
    isDetectedAsRoundTrip: isRoundTrip,
    explicitlyOneWay: tripDetails.flight?.tripType === "ONE_WAY" || tripDetails.flight?.tripType === "ONEWAY"
  });

  const formatCurrency = (amount) => {
    return `RS. ${Math.floor(amount * 280)}`;
  };

  // Calculate flight duration if times are available
  const calculateDuration = (departureTime, arrivalTime) => {
    if (!departureTime || !arrivalTime) return 'N/A';
    
    try {
      const depTime = new Date(departureTime).getTime();
      const arrTime = new Date(arrivalTime).getTime();
      const durationMinutes = (arrTime - depTime) / (1000 * 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = Math.round(durationMinutes % 60);
      return `${hours}h ${minutes}m`;
    } catch(e) {
      return 'N/A';
    }
  };

  // Extract return trip data from segments if available
  const getReturnTripData = () => {
    // First try to get data from segments array
    if (tripDetails.flight?.segments && tripDetails.flight.segments.length > 1) {
      console.log("Found return segment data:", tripDetails.flight.segments[1]);
      return {
        departure: tripDetails.flight.segments[1]?.departureAirport?.name || 
                  tripDetails.flight.segments[1]?.departureAirport?.cityName || 
                  tripDetails.flight.returnDeparture || 
                  tripDetails.flight.arrival ||
                  searchResults?.to, // Fallback to search params
        arrival: tripDetails.flight.segments[1]?.arrivalAirport?.name || 
                tripDetails.flight.segments[1]?.arrivalAirport?.cityName || 
                tripDetails.flight.returnArrival || 
                tripDetails.flight.departure ||
                searchResults?.from, // Fallback to search params
        departureTime: tripDetails.flight.segments[1]?.departureTime || 
                      tripDetails.flight.returnDepartureTime || 
                      "Date not available",
        arrivalTime: tripDetails.flight.segments[1]?.arrivalTime || 
                    tripDetails.flight.returnArrivalTime ||
                    "Date not available",
        departureCode: tripDetails.flight.segments[1]?.departureAirport?.code,
        arrivalCode: tripDetails.flight.segments[1]?.arrivalAirport?.code,
        flightNumber: tripDetails.flight.segments[1]?.legs?.[0]?.flightNumber || 
                     tripDetails.flight.segments[1]?.legs?.[0]?.flightInfo?.flightNumber || 
                     tripDetails.flight.returnFlightNumber || 
                     tripDetails.flight.flightNumber || 
                     "N/A",
        airline: tripDetails.flight.segments[1]?.legs?.[0]?.carriersData?.[0]?.name ||
                tripDetails.flight.returnAirline ||
                tripDetails.flight.airline || 
                "N/A",
        cabinClass: tripDetails.flight.segments[1]?.legs?.[0]?.cabinClass || 
                   tripDetails.flight.segments[0]?.legs?.[0]?.cabinClass || 
                   tripDetails.flight.cabinClass ||
                   searchResults?.cabinClass ||
                   'Economy'
      };
    }
    
    // If no segments, try return-specific properties
    if (tripDetails.flight?.returnDeparture || tripDetails.flight?.returnDepartureTime) {
      console.log("Found return specific properties");
      return {
        departure: tripDetails.flight.returnDeparture || tripDetails.flight.arrival || searchResults?.to,
        arrival: tripDetails.flight.returnArrival || tripDetails.flight.departure || searchResults?.from,
        departureTime: tripDetails.flight.returnDepartureTime || "Date not available",
        arrivalTime: tripDetails.flight.returnArrivalTime || "Date not available",
        departureCode: tripDetails.flight.returnDepartureCode,
        arrivalCode: tripDetails.flight.returnArrivalCode,
        flightNumber: tripDetails.flight.returnFlightNumber || tripDetails.flight.flightNumber || "N/A",
        airline: tripDetails.flight.returnAirline || tripDetails.flight.airline || "N/A",
        cabinClass: tripDetails.flight.returnCabinClass || tripDetails.flight.cabinClass || 
                   searchResults?.cabinClass || 'Economy'
      };
    }
    
    // If searchResults indicates RETURN trip, create basic return info by swapping from/to
    if (searchResults?.tripType === "RETURN") {
      console.log("Creating return data from search parameters");
      return {
        departure: searchResults.to || tripDetails.flight?.arrival,
        arrival: searchResults.from || tripDetails.flight?.departure,
        departureTime: searchResults.returnDate ? `${searchResults.returnDate} (estimated)` : "Date not available",
        arrivalTime: "Date not available",
        departureCode: "",
        arrivalCode: "",
        flightNumber: tripDetails.flight?.flightNumber || "N/A",
        airline: tripDetails.flight?.airline || "N/A",
        cabinClass: searchResults.cabinClass || tripDetails.flight?.cabinClass || 'Economy'
      };
    }
    
    // Last resort, swap outbound data
    console.log("Falling back to swapped outbound data");
    return {
      departure: tripDetails.flight?.arrival || searchResults?.to || "N/A",
      arrival: tripDetails.flight?.departure || searchResults?.from || "N/A",
      departureTime: searchResults?.returnDate ? `${searchResults.returnDate} (estimated)` : "Date not available",
      arrivalTime: "Date not available",
      flightNumber: tripDetails.flight?.flightNumber || "N/A",
      airline: tripDetails.flight?.airline || "N/A",
      cabinClass: tripDetails.flight?.cabinClass || searchResults?.cabinClass || 'Economy'
    };
  };

  // Extract outbound trip data
  const getOutboundTripData = () => {
    return {
      departure: tripDetails.flight?.segments?.[0]?.departureAirport?.name || 
                tripDetails.flight?.segments?.[0]?.departureAirport?.cityName || 
                tripDetails.flight?.departure || 
                searchResults?.from ||
                "N/A",
      arrival: tripDetails.flight?.segments?.[0]?.arrivalAirport?.name || 
              tripDetails.flight?.segments?.[0]?.arrivalAirport?.cityName || 
              tripDetails.flight?.arrival || 
              searchResults?.to ||
              "N/A",
      departureTime: tripDetails.flight?.segments?.[0]?.departureTime || 
                    tripDetails.flight?.departureTime ||
                    searchResults?.departureDate ? `${searchResults.departureDate} (estimated)` : "Date not available",
      arrivalTime: tripDetails.flight?.segments?.[0]?.arrivalTime || 
                  tripDetails.flight?.arrivalTime ||
                  "Date not available",
      departureCode: tripDetails.flight?.segments?.[0]?.departureAirport?.code,
      arrivalCode: tripDetails.flight?.segments?.[0]?.arrivalAirport?.code,
      flightNumber: tripDetails.flight?.segments?.[0]?.legs?.[0]?.flightNumber || 
                   tripDetails.flight?.segments?.[0]?.legs?.[0]?.flightInfo?.flightNumber || 
                   tripDetails.flight?.flightNumber || "N/A",
      airline: tripDetails.flight?.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.name || 
              tripDetails.flight?.airline || "N/A",
      cabinClass: tripDetails.flight?.segments?.[0]?.legs?.[0]?.cabinClass || 
                 tripDetails.flight?.cabinClass || 
                 searchResults?.cabinClass || 
                 'Economy'
    };
  };

  const outboundData = getOutboundTripData();
  const returnData = isRoundTrip ? getReturnTripData() : null;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Trip Booking Invoice</Text>
            <Text style={styles.subtitle}>Transaction ID: {transactionId}</Text>
            <Text style={styles.subtitle}>Date: {currentDate}</Text>
          </View>
          {/* Placeholder for logo - you can add your actual logo */}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>JetSeeker</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{userData?.name || userData?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userData?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{userData?.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Flight Details - Enhanced for Round Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          
          {/* Trip Type Indicator */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Trip Type:</Text>
              <Text style={styles.value}>{isRoundTrip ? "Round Trip" : "One Way"}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Flight Price:</Text>
              <Text style={styles.value}>{formatCurrency(tripDetails.flight?.amount)}</Text>
            </View>
          </View>
          
          {/* Divider */}
          <View style={{borderBottom: '1 solid #e5e7eb', marginVertical: 8}} />
          
          {/* Outbound Flight */}
          <View style={styles.outboundSection}>
            <Text style={[styles.flightTypeLabel, {color: '#3b82f6'}]}>
              OUTBOUND FLIGHT
            </Text>
            
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>From:</Text>
                <Text style={styles.value}>
                  {outboundData.departure}
                  {outboundData.departureCode && ` (${outboundData.departureCode})`}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>To:</Text>
                <Text style={styles.value}>
                  {outboundData.arrival}
                  {outboundData.arrivalCode && ` (${outboundData.arrivalCode})`}
                </Text>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Departure:</Text>
                <Text style={styles.value}>{formatDateTime(outboundData.departureTime)}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Arrival:</Text>
                <Text style={styles.value}>{formatDateTime(outboundData.arrivalTime)}</Text>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Flight Number:</Text>
                <Text style={styles.value}>{outboundData.flightNumber}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>
                  {calculateDuration(outboundData.departureTime, outboundData.arrivalTime)}
                </Text>
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Airline:</Text>
                <Text style={styles.value}>{outboundData.airline}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Cabin Class:</Text>
                <Text style={styles.value}>{outboundData.cabinClass}</Text>
              </View>
            </View>
          </View>
          
          {/* Return Flight - Only for round trips */}
          {isRoundTrip && returnData && (
            <>
              {/* Divider between flights */}
              <View style={styles.flightSeparator} />
              
              <View style={styles.returnSection}>
                <Text style={[styles.flightTypeLabel, {color: '#10b981'}]}>
                  RETURN FLIGHT
                </Text>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>From:</Text>
                    <Text style={styles.value}>
                      {returnData.departure}
                      {returnData.departureCode && ` (${returnData.departureCode})`}
                    </Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.value}>
                      {returnData.arrival}
                      {returnData.arrivalCode && ` (${returnData.arrivalCode})`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Departure:</Text>
                    <Text style={styles.value}>{formatDateTime(returnData.departureTime)}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Arrival:</Text>
                    <Text style={styles.value}>{formatDateTime(returnData.arrivalTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Flight Number:</Text>
                    <Text style={styles.value}>{returnData.flightNumber}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Duration:</Text>
                    <Text style={styles.value}>
                      {calculateDuration(returnData.departureTime, returnData.arrivalTime)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Airline:</Text>
                    <Text style={styles.value}>{returnData.airline}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Cabin Class:</Text>
                    <Text style={styles.value}>{returnData.cabinClass}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Enhanced Hotel Details */}
        <View style={styles.hotelSection}>
          <Text style={[styles.sectionTitle, {color: '#065f46'}]}>Hotel Details</Text>
          
          <View style={styles.row}>
            <Text style={[styles.label, {color: '#065f46'}]}>Hotel Name:</Text>
            <Text style={styles.value}>{tripDetails.hotel?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={[styles.label, {color: '#065f46'}]}>Address/Location:</Text>
            <Text style={styles.value}>{tripDetails.hotel?.location || tripDetails.hotel?.address || 'N/A'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Check-in:</Text>
              <Text style={styles.value}>{checkIn}</Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Check-out:</Text>
              <Text style={styles.value}>{checkOut}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Rating:</Text>
              <Text style={styles.value}>
                {tripDetails.hotel?.rating || 'N/A'} {tripDetails.hotel?.rating && '★'}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Days of Stay:</Text>
              <Text style={styles.value}>{tripDetails.hotel?.daysOfStay || 1} night(s)</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Price Per Night:</Text>
              <Text style={styles.value}>RS. {Math.floor((tripDetails.hotel?.pricePerDay || 0) * 280)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.label, {color: '#065f46'}]}>Total Hotel Price:</Text>
              <Text style={styles.value}>RS. {Math.floor((tripDetails.hotel?.totalPrice || 0) * 280)}</Text>
            </View>
          </View>
          
          {/* Hotel amenities if available */}
          {hotelAmenities.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.label, {color: '#065f46', marginBottom: 5}]}>Amenities:</Text>
              <View style={styles.amenityContainer}>
                {hotelAmenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityBox}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {/* Hotel policies if available */}
          {tripDetails.hotel?.policies && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.label, {color: '#065f46'}]}>Hotel Policies:</Text>
              <Text style={[styles.value, {fontSize: 10}]}>{tripDetails.hotel.policies}</Text>
            </>
          )}
          
          {/* Reservation notes if available */}
          {tripDetails.hotel?.notes && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.label, {color: '#065f46'}]}>Reservation Notes:</Text>
              <Text style={[styles.value, {fontSize: 10}]}>{tripDetails.hotel.notes}</Text>
            </>
          )}
        </View>

        {/* Room Details if available */}
        {tripDetails.hotel?.roomType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Room Type:</Text>
              <Text style={styles.value}>{tripDetails.hotel.roomType}</Text>
            </View>
            {tripDetails.hotel?.bedType && (
              <View style={styles.row}>
                <Text style={styles.label}>Bed Type:</Text>
                <Text style={styles.value}>{tripDetails.hotel.bedType}</Text>
              </View>
            )}
            {tripDetails.hotel?.maxGuests && (
              <View style={styles.row}>
                <Text style={styles.label}>Maximum Guests:</Text>
                <Text style={styles.value}>{tripDetails.hotel.maxGuests}</Text>
              </View>
            )}
            {tripDetails.hotel?.roomAmenities && tripDetails.hotel.roomAmenities.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Room Features:</Text>
                <Text style={styles.value}>{tripDetails.hotel.roomAmenities.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>
              {paymentMethod === 'credit' ? 'Credit Card' : 'Debit Card'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>Confirmed</Text>
          </View>          <View style={styles.total}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>RS. {Math.floor(totalAmount * 280)}</Text>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Information</Text>
          <View style={styles.row}>
            <Text style={[styles.value, {fontSize: 10}]}>
              • Please present a valid ID and the credit card used for payment at check-in.
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.value, {fontSize: 10}]}>
              • Flight changes may affect hotel reservations. Please contact customer service for any changes.
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.value, {fontSize: 10}]}>
              • Standard check-in time for hotels is typically after 2:00 PM and check-out is before 12:00 PM.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for booking with JetSeeker. For any queries, please contact support@jetseeker.com</Text>
          <Text>© {new Date().getFullYear()} JetSeeker. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TripInvoicePDF;
