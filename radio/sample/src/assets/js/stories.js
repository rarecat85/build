const storiesSwiper = document.querySelector(".stories .swiper");

if (storiesSwiper) {
  const swiperOptions = {
    slidesPerView: 1.2,
    spaceBetween: 10,
    navigation: {
      nextEl: ".swiper-btnbx-next",
      prevEl: ".swiper-btnbx-prev",
    },
    breakpoints: {
      769: {
        slidesPerView: 3,
        spaceBetween: 16,
      },
      1441: {
        slidesPerView: 3,
        spaceBetween: 24,
      }
    },
  }

  const swiperInstance = new Swiper(storiesSwiper, swiperOptions);
}