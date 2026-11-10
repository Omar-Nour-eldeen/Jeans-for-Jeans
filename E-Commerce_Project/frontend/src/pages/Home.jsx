import React from "react";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import LatestCollection from "../components/LatestCollection";
import Footer from "../components/Footer";
import OurPolicy from "../components/Ourpolicy";
import SearchBar from "../components/SearchBar";
import { assets } from "../assets/assets";
import Title from "../components/Title";
function Home() {
  return (
    <div>
      <Navbar />
      <img className="w-full" src={assets.bg} alt="" />
      <div className="text-center py-8 text-5xl animate-pulse">
        <Title text1={"NEW"} text2={"SALE"} />
      </div>
      <SearchBar />
      <Banner />
      <LatestCollection />
      <OurPolicy />
      <Footer />
    </div>
  );
}

export default Home;
