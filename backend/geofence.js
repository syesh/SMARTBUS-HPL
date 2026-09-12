// Haversine formula to calculate distance in meters between two coordinates
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Checks if a bus is within a boarding point's geofence.
 * @param {Object} busLocation - { lat, lng }
 * @param {Object} boardingPoint - { lat, lng, radius_meters }
 * @returns {boolean} true if inside geofence
 */
function isBusInGeofence(busLocation, boardingPoint) {
  const distance = getDistanceFromLatLonInMeters(
    busLocation.lat,
    busLocation.lng,
    boardingPoint.lat,
    boardingPoint.lng
  );
  return distance <= boardingPoint.radius_meters;
}

module.exports = {
  getDistanceFromLatLonInMeters,
  isBusInGeofence
};
