let bookingDetails;

let bookingId;

exports.getBookingId = () => bookingId;

exports.setBookingId = (id) => (bookingId = id);

exports.getBookingDetails = () => bookingDetails;

exports.setBookingDetails = (fromAddress, toAddress, material, weight, trucks, date) => {
  bookingDetails = {
    fromAddress,
    toAddress,
    material,
    weight,
    trucks,
    date,
  };
};
