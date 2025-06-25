// utils/decodeToken.js
export function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found");
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Decoded token payload:", payload);
    return payload.uid; 
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}


// utils/decodeToken.js
export function getToken() {
  return localStorage.getItem("token");
}

