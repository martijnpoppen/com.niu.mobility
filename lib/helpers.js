exports.sleep = async function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

exports.calcCrow = function ($lat1, $lon1, $lat2, $lon2) {
  $R = 6371; // km
  $dLat = toRad($lat2 - $lat1);
  $dLon = toRad($lon2 - $lon1);
  $lat1 = toRad($lat1);
  $lat2 = toRad($lat2);

  $a =
    Math.sin($dLat / 2) * Math.sin($dLat / 2) +
    Math.sin($dLon / 2) *
      Math.sin($dLon / 2) *
      Math.cos($lat1) *
      Math.cos($lat2);
  $c = 2 * Math.atan2(Math.sqrt($a), Math.sqrt(1 - $a));
  $d = $R * $c;
  return $d.toFixed(1);
};

// Converts numeric degrees to radians
function toRad($Value) {
  return ($Value * Math.PI) / 180;
}

exports.formatSecondsToMinutes = function (timestamp) {
    const minutes = Math.floor(timestamp / 60);
    const seconds = (timestamp % 60) / 100;
    return minutes+seconds;
};
