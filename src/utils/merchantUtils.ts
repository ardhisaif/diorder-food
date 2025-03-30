export const isCurrentlyOpen = (openingHours: {
  open: string;
  close: string;
}): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Convert opening hours to minutes for easy comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const [openHour, openMinute] = openingHours.open.split(":").map(Number);
  const [closeHour, closeMinute] = openingHours.close.split(":").map(Number);

  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;

  return (
    currentTimeInMinutes >= openTimeInMinutes &&
    currentTimeInMinutes < closeTimeInMinutes
  );
};
