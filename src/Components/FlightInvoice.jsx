import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40 },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  section: { margin: 10, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontWeight: 'bold' },
  value: { maxWidth: '60%' },
  divider: { borderBottom: 1, borderColor: '#999', marginVertical: 10 },
});

export const FlightInvoicePDF = ({ flightDetails, transactionId, paymentMethod }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Flight Booking Invoice</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Transaction ID: {transactionId}</Text>
        <Text style={styles.label}>Date: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Flight Route:</Text>
          <Text style={styles.value}>
            {flightDetails.segments?.[0]?.departureAirport?.name} → 
            {flightDetails.segments?.[0]?.arrivalAirport?.name}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Departure:</Text>
          <Text style={styles.value}>{flightDetails.segments?.[0]?.departureTime}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Arrival:</Text>
          <Text style={styles.value}>{flightDetails.segments?.[0]?.arrivalTime}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Flight Number:</Text>
          <Text style={styles.value}>
            {flightDetails.segments?.[0]?.legs?.[0]?.flightNumber}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Cabin Class:</Text>
          <Text style={styles.value}>{flightDetails.segments?.[0]?.cabinClass}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{paymentMethod}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Amount Paid:</Text>
          <Text style={styles.value}>
            ₹{flightDetails.travellerPrices?.[0]?.travellerPriceBreakdown?.totalWithoutDiscountRounded?.units}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);
