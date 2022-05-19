import React, { useEffect, useState } from "react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { BiSad } from "react-icons/bi";
import FacilityItem from "./FacilityItem";
import Axios from "axios";
import FacilitySkeleton from "./FacilitySkeleton";
import { useSelector } from "react-redux";

function Facilities() {
  const { cart } = useSelector((state) => state.cart);
  const defaultMessage = "No results found";
  const [isLoading, setisLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  const fetResults = () => {
    setisLoading(true);
    setErrorMessage("");
    Axios.get(
      process.env.REACT_APP_BACKEND_URL +
        "/facility/find/category/" +
        activeTab +
        "/"
    )
      .then((res) => {
        setisLoading(false);
        setResults(res.data.result);
      })
      .catch((error) => {
        setisLoading(false);
        if (error?.response?.data?.msg) {
          setErrorMessage(error?.response?.data?.msg);
        } else {
          setErrorMessage(error.message);
        }
      });
  };

  useEffect(() => {
    fetResults();
  }, [activeTab]);
  return (
    <div className="facilities-main-container">
      <div className="tabs-container mb-5">
        <ul>
          <li
            className={activeTab == "" || activeTab == "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All
          </li>
          <li
            className={activeTab == "hotels" ? "active" : ""}
            onClick={() => setActiveTab("hotels")}
          >
            Hotels
          </li>
          <li
            className={activeTab == "restaurants" ? "active" : ""}
            onClick={() => setActiveTab("restaurants")}
          >
            Restaurants
          </li>
          <li
            className={activeTab == "coffeeshops" ? "active" : ""}
            onClick={() => setActiveTab("coffeeshops")}
          >
            Coffee shops
          </li>
        </ul>
        <div className="cart-container">
          <div className="contents">
            <HiOutlineShoppingBag color="black" size={30} />
            <div className="counter">
              <span>{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <FacilitySkeleton />
      ) : (
        <>
          <div className="row">
            {results.length > 0 ? (
              <>
                {results.map((facility, index) => (
                  <FacilityItem facility={facility} key={index} />
                ))}
              </>
            ) : (
              <div className="text-center mt-3">
                <BiSad size={50} color="#ccc" />
                <p> {errorMessage === "" ? defaultMessage : errorMessage}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Facilities;
