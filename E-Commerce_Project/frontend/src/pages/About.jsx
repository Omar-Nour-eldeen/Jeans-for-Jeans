import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
function About() {
  return (
    <>
      <Navbar />
      <div>
        <div className="text-2xl text-center pt-8 border-t">
          <Title text1={"ABOUT"} text2={"US"} />
        </div>
        <div className="my-10 flex flex-col md:flex-row gap-16">
          <img
            className="w-full md:max-w-112.5"
            src={assets.about_img}
            alt=""
          />
          <div className="my-10 flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
            <p>
              # About Jeans for Jeans We believe denim is more than fabric —
              it's a lifestyle. Jeans for Jeans was born from one simple
              obsession: finding the perfect pair. Not just any jeans, but the
              ones that feel like they were made for *you* — the right fit, the
              right wash, the right energy. We curate every piece with
              intention, from classic cuts that never go out of style to modern
              silhouettes that push the limit. Whether you're dressing up or
              keeping it casual, we've got a pair for every version of you.
              Denim is personal. That's why we take it seriously.
            </p>
            <b className="text-gray-800">Our Mission</b>
            <p>
              # It started with a simple frustration — finding great jeans
              shouldn't be this hard. Jeans for Jeans was created for people who
              know what they want but are tired of settling. We started small,
              with a tight edit of styles we actually loved, and grew by
              listening to the people who wore them. Today, we're a destination
              for denim that fits real life — versatile, durable, and built to
              move with you. Every wash, every cut, every detail is chosen with
              care. Because when you find the right pair, you just know.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default About;
