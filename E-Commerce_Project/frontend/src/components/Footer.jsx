import React from "react";
import { assets } from "../assets/assets";
function Footer() {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm bg-gray-300 rounded-lg p-10">
        <div>
          <img className="mb-5 w-32" src={assets.Jeans} alt="Logo" />
          <p className="w-full md:w-2/3 text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab
            laudantium nam fugit amet explicabo, fugiat deleniti! Cupiditate,
            delectus culpa! Laborum maxime eum quibusdam molestiae officia
            aliquid dolor reprehenderit quam praesentium.
          </p>
        </div>
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>Home</li>
            <li>About</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div>
          <p className="text-xl font-medium mb-5">SUPPORT</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+1-212-555-0123</li>
            <li>Contact@JeansForJeans.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="text-center text-sm text-gray-600 py-5">
        &copy; 2026 Jeans. All rights reserved.
      </p>
    </div>
  );
}
export default Footer;
