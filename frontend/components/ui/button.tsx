import * as React from "react";

export function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
    >
      {children}
    </button>
  );
}
