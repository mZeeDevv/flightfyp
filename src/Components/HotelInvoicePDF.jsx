import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
});

// Create Document Component
const HotelInvoicePDF = ({ bookingDetails, transactionId, paymentMethod }) => {
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

  // Calculate check-out date
  const calculateCheckoutDate = (checkInDate, daysOfStay) => {
    try {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + parseInt(daysOfStay));
      return formatDate(checkOut);
    } catch (e) {
      return 'N/A';
    }
  };

  const currentDate = formatDate(new Date().toISOString());
  const checkInDate = formatDate(bookingDetails.hotel.checkInDate);
  const checkOutDate = calculateCheckoutDate(bookingDetails.hotel.checkInDate, bookingDetails.hotel.daysOfStay);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hotel Booking Invoice</Text>
            <Text style={styles.subtitle}>Transaction ID: {transactionId}</Text>
            <Text style={styles.subtitle}>Date: {currentDate}</Text>
          </View>
          {/* Placeholder for logo */}
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>JetSeeker</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{bookingDetails.userId || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Booking Date:</Text>
            <Text style={styles.value}>{formatDate(bookingDetails.createdAt)}</Text>
          </View>
        </View>

        {/* Hotel Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hotel Name:</Text>
            <Text style={styles.value}>{bookingDetails.hotel.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{bookingDetails.hotel.location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rating:</Text>
            <Text style={styles.value}>{bookingDetails.hotel.rating || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Check-in Date:</Text>
              <Text style={styles.value}>{checkInDate}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Check-out Date:</Text>
              <Text style={styles.value}>{checkOutDate}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{bookingDetails.hotel.daysOfStay || 1} {bookingDetails.hotel.daysOfStay === 1 ? 'night' : 'nights'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Price per Night:</Text>
              <Text style={styles.value}>RS. {bookingDetails.hotel.pricePerNight * 270 || 0}</Text>
            </View>
          </View>
        </View>

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
            <Text style={styles.label}>Card Number:</Text>
            <Text style={styles.value}>**** **** **** {bookingDetails.paymentDetails?.cardLast4 || '****'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{bookingDetails.paymentDetails?.paymentStatus || 'Confirmed'}</Text>
          </View>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>RS. {bookingDetails.hotel.totalPrice || 0}</Text>
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

export default HotelInvoicePDF;
