"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCategories();
    }
  }, [isLoggedIn, currentPage]);

  if (!isLoggedIn) {
    return (
      <div>
        Please wait! If not load in sometime{" "}
        <Link href="/auth/login" className="text-indigo-600 hover:underline">
          Login
        </Link>{" "}
        to view this page.
      </div>
    );
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/categories?page=${currentPage}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      setCategories(response.data.categories);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error(error);
      setIsLoggedIn(false);
    }
  };

  const toggleInterest = async (categoryId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/toggle-interest`,
        { categoryId },
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      // Update the categories state
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === categoryId
            ? { ...category, interested: !category.interested }
            : category
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-gray-100 px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Categories</h1>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg shadow-md bg-white p-4 flex flex-col gap-2"
          >
            <h2 className="text-xl font-medium text-gray-800">
              {category.name}
            </h2>
            <p className="text-gray-600">
              Interested: {category.interested ? "Yes" : "No"}
            </p>
            <button
              onClick={() => toggleInterest(category.id)}
              className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none  ${
                category.interested
                  ? "hover:bg-red-700 bg-red-500"
                  : "hover:bg-blue-700 bg-blue-500"
              }`}
            >
              {category.interested ? "Remove Interest" : "Add Interest"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentPage((oldPage) => Math.max(oldPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-md text-gray-700 font-medium disabled:opacity-50 hover:text-blue-500 focus:outline-none"
        >
          Previous
        </button>

        {/* Page numbers */}
        {[...Array(totalPages).keys()].map((value) => (
          <button
            key={value + 1}
            onClick={() => setCurrentPage(value + 1)}
            className={`px-4 py-2 rounded-md text-gray-700 font-medium ${
              currentPage === value + 1
                ? "text-blue-500"
                : "hover:text-blue-500"
            } focus:outline-none`}
          >
            {value + 1}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((oldPage) => Math.min(oldPage + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-md text-gray-700 font-medium disabled:opacity-50 hover:text-blue-500 focus:outline-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
