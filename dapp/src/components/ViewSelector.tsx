"use client";
import React from "react";
import styles from "./ViewSelector.module.css";
import { GiHamburgerMenu } from "react-icons/gi";

interface ViewSelectorProps {
  currentView: "tokenmenu" | "dashboard";
  onViewChange: (view: "tokenmenu" | "dashboard") => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  currentView,
  onViewChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleViewSelect = (view: "tokenmenu" | "dashboard") => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown}>
      <button className={styles.dropdownButton} onClick={toggleDropdown}>
        <GiHamburgerMenu size={20} />
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button
            className={`${styles.dropdownItem} ${
              currentView === "tokenmenu" ? styles.active : ""
            }`}
            onClick={() => handleViewSelect("tokenmenu")}
          >
            Token Menu
          </button>
          <button
            className={`${styles.dropdownItem} ${
              currentView === "dashboard" ? styles.active : ""
            }`}
            onClick={() => handleViewSelect("dashboard")}
          >
            Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
