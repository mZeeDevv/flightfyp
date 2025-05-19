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
});

// Create Document Component
const TripInvoicePDF = ({ tripDetails, transactionId, paymentMethod, userData, totalAmount }) => {
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

  const currentDate = formatDate(new Date().toISOString());
  
  // Format check-in and check-out dates if available
  const checkIn = tripDetails.hotel?.checkIn ? formatDate(tripDetails.hotel.checkIn) : formatDate(tripDetails.flight?.departureTime);
  const checkOut = tripDetails.hotel?.checkOut ? formatDate(tripDetails.hotel.checkOut) : formatDate(tripDetails.flight?.arrivalTime);
  
  // Hotel amenities (if available)
  const hotelAmenities = tripDetails.hotel?.amenities || [];
  
  // Properly detect if this is a round trip flight by checking multiple indicators
  const isRoundTrip = tripDetails.flight?.isRoundTrip || 
                     (tripDetails.flight?.returnDepartureTime && tripDetails.flight?.returnArrivalTime) ||
                     (tripDetails.flight?.returnDeparture && tripDetails.flight?.returnArrival) ||
                     (tripDetails.flight?.tripType === "ROUNDTRIP");

  // Debug log to see what round trip indicators are available
  console.log("Trip PDF - Round Trip indicators:", {
    isRoundTripFlag: tripDetails.flight?.isRoundTrip,
    hasReturnTimes: !!(tripDetails.flight?.returnDepartureTime && tripDetails.flight?.returnArrivalTime),
    hasReturnLocations: !!(tripDetails.flight?.returnDeparture && tripDetails.flight?.returnArrival),
    tripType: tripDetails.flight?.tripType,
    isDetectedAsRoundTrip: isRoundTrip
  });
  
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

        {/* Flight Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          
          {/* Check if it's a round trip using our more robust detection */}
          {isRoundTrip ? (
            <>
              {/* Outbound Flight */}
              <View style={{marginBottom: 10}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                  <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 5}} />
                  <Text style={{fontSize: 14, fontWeight: 'bold', color: '#3b82f6'}}>Outbound Flight</Text>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>From:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.departure || 'N/A'}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.arrival || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Departure Time:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.departureTime || 'N/A'}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Arrival Time:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.arrivalTime || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Flight Number:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.flightNumber || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              
              {/* Return Flight */}
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 10}}>
                  <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 5}} />
                  <Text style={{fontSize: 14, fontWeight: 'bold', color: '#10b981'}}>Return Flight</Text>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>From:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.returnDeparture || tripDetails.flight?.arrival || 'N/A'}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.returnArrival || tripDetails.flight?.departure || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Departure Time:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.returnDepartureTime || 'N/A'}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Arrival Time:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.returnArrivalTime || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Flight Number:</Text>
                    <Text style={styles.value}>{tripDetails.flight?.returnFlightNumber || tripDetails.flight?.flightNumber || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              
              {/* Common flight price */}
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Flight Price (Total):</Text>
                  <Text style={styles.value}>RS. {Math.floor((tripDetails.flight?.amount || 0) * 280)}</Text>
                </View>
              </View>
            </>
          ) : (
            // One-way flight
            <>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>From:</Text>
                  <Text style={styles.value}>{tripDetails.flight?.departure || 'N/A'}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>To:</Text>
                  <Text style={styles.value}>{tripDetails.flight?.arrival || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Departure Time:</Text>
                  <Text style={styles.value}>{tripDetails.flight?.departureTime || 'N/A'}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Arrival Time:</Text>
                  <Text style={styles.value}>{tripDetails.flight?.arrivalTime || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Flight Number:</Text>
                  <Text style={styles.value}>{tripDetails.flight?.flightNumber || 'N/A'}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Flight Price:</Text>
                  <Text style={styles.value}>RS. {Math.floor((tripDetails.flight?.amount || 0) * 280)}</Text>
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
