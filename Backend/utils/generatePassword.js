const generatePassword = () => {
  const prefix = "MHV";
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
  return `${prefix}${randomNum}`;
};

module.exports = generatePassword;
