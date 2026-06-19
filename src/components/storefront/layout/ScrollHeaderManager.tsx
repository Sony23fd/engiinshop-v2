"use client"
import { useEffect } from "react"

export function ScrollHeaderManager() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const header = document.getElementById("storefront-header");
    if (!header) return;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      
      // Hide header when scrolling down past 100px
      if (direction === "down" && (scrollY - lastScrollY > 10) && scrollY > 100) {
        header.style.transform = "translateY(-100%)";
      } 
      // Show header when scrolling up or near the top
      else if ((direction === "up" && (lastScrollY - scrollY > 10)) || scrollY <= 100) {
        header.style.transform = "translateY(0)";
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollDirection);
    }
  }, []);

  return null;
}
