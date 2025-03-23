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
              <Text style={styles.value}>RS. {tripDetails.flight?.amount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Hotel Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hotel Name:</Text>
            <Text style={styles.value}>{tripDetails.hotel?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{tripDetails.hotel?.location || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Rating:</Text>
              <Text style={styles.value}>{tripDetails.hotel?.rating || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Hotel Price:</Text>
              <Text style={styles.value}>RS. {tripDetails.hotel?.price || 0}</Text>
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
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>Confirmed</Text>
          </View>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>RS. {totalAmount}</Text>
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
