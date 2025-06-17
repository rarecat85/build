gsap.registerPlugin(ScrollTrigger);

// 반응형 설정
const RESPONSIVE = {
  desktop4k: {
    breakpoint: 2560,
    startPosition: 200, // 시작 위치
    endPosition: 80   // 최종 이동 위치
  },
  desktop: {
    breakpoint: 1025,
    startPosition: 120, // 시작 위치
    endPosition: 80   // 최종 이동 위치
  },
  tablet: {
    breakpoint: 769,
    startPosition: 150,
    endPosition: 100
  },
  mobile: {
    breakpoint: 0,
    startPosition: 0,
    endPosition: 20
  }
};

// 현재 화면 크기에 따른 설정 가져오기
function getCurrentSettings() {
  const width = window.innerWidth;
  if (width >= RESPONSIVE.desktop4k.breakpoint) {
    return RESPONSIVE.desktop4k;
  } else if (width >= RESPONSIVE.desktop.breakpoint) {
    return RESPONSIVE.desktop;
  } else if (width >= RESPONSIVE.tablet.breakpoint) {
    return RESPONSIVE.tablet;
  }
  return RESPONSIVE.mobile;
}

function parallax() {
  const parallaxContainer = document.querySelector(".parallax-container");
  const parallaxItems = gsap.utils.toArray(".parallax-item");
  const parallaxLogo = document.querySelector(".parallax-txt-bx-logo");
  const parallaxSticker = document.querySelector(".parallax-txt-bx-logo-sticker");
  const parallaxTitle = document.querySelector(".parallax-txt-bx-title");
  const parallaxRadioControls = document.querySelector(".parallax-txt-bx-radio-controls");
  const parallaxRadioBtns = document.querySelector(".parallax-txt-bx-btns");
  const firstLine = document.querySelector(".parallax-txt-bx-radio-controls-line:first-child");
  const secondLine = document.querySelector(".parallax-txt-bx-radio-controls-line:last-child");

  // 인트로 애니메이션 재생 함수
  function playIntroAnimation() {
    // 기존 애니메이션 중단
    if (introTimeline) {
      introTimeline.kill();
    }

    // 요소들 초기 상태로 리셋
    gsap.set([parallaxLogo, parallaxSticker, parallaxTitle, parallaxRadioControls, parallaxRadioBtns], {
      opacity: 0
    });
    gsap.set(parallaxLogo, { y: 50 });
    gsap.set(parallaxSticker, { scale: 1 }); // 스티커 컨테이너는 scale 1로 설정
    gsap.set(parallaxTitle, { y: 30 });
    gsap.set(firstLine, { width: "0%" });
    gsap.set(secondLine, { width: "calc(100% - 1rem)" });

    // 스티커 초기 상태 설정
    const radioSticker = document.querySelector(".parallax-txt-bx-logo-sticker-radio");
    const logoSticker = document.querySelector(".parallax-txt-bx-logo-sticker-logo");
    gsap.set([radioSticker, logoSticker], { 
      opacity: 0,
      scale: 0,
      rotation: 0
    });

    // 인트로 애니메이션 재생
    const newIntroTimeline = gsap.timeline({ delay: 0.5 });
    
    // 1. 로고 - 아래에서 나타나기
    newIntroTimeline
      .fromTo(
        parallaxLogo,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }
      )
      // 2. 스티커 컨테이너 나타나기
      .fromTo(
        parallaxSticker,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 0.1,
        },
        "-=0.3"
      )
      // 3. 스티커들 나타나기 (아주 약간의 시차)
      .fromTo(
        radioSticker,
        {
          opacity: 0,
          scale: 0,
          rotation: -20,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.3)",
        },
        "-=0.1"
      )
      .fromTo(
        logoSticker,
        {
          opacity: 0,
          scale: 0,
          rotation: 20,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.3)",
        },
        "-=0.3"  // 라디오 스티커보다 0.1초 먼저 시작
      )
      // 4. 스티커들 회전 (약간의 시차)
      .to(
        radioSticker,
        {
          rotation: 0,
          duration: 0.25,
          ease: "power2.out",
        }
      )
      .to(
        logoSticker,
        {
          rotation: 0,
          duration: 0.25,
          ease: "power2.out",
        },
        "-=0.15"
      )
      // 5. 타이틀 - 아래에서 나타나기
      .fromTo(
        parallaxTitle,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      )
      // 6. 라디오 컨트롤 - 나타나기
      .addLabel("radioControls", "-=0.3")
      .fromTo(
        [parallaxRadioControls, parallaxRadioBtns],
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        "radioControls"
      )
      // 7. 첫 번째 라인 - 0에서 현재값까지 확장
      .fromTo(
        firstLine,
        {
          width: "0%",
        },
        {
          width: "calc(100% - 1rem)",
          duration: 3.5,
          ease: "power1.out",
        },
        "-=0.1"
      )
      // 8. 두 번째 라인 - 현재값에서 0까지 축소
      .fromTo(
        secondLine,
        {
          width: "calc(100% - 1rem)",
        },
        {
          width: "0%",
          duration: 3.5,
          ease: "power1.out",
        },
        "<"
      )
      .to(
        parallaxRadioControls, {overflow: "unset"}
      );
  }

  // 최초 로딩 애니메이션 타임라인
  const introTimeline = gsap.timeline({ delay: 0.5 });

  // 스티커 초기 상태 설정
  const radioSticker = document.querySelector(".parallax-txt-bx-logo-sticker-radio");
  const logoSticker = document.querySelector(".parallax-txt-bx-logo-sticker-logo");
  gsap.set([radioSticker, logoSticker], { 
    opacity: 0,
    scale: 0,
    rotation: 0
  });
  gsap.set(parallaxSticker, { scale: 1 }); // 스티커 컨테이너는 scale 1로 설정

  // 인트로 애니메이션 실행
  introTimeline
    .fromTo(
      parallaxLogo,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      }
    )
    // 스티커 컨테이너 나타나기
    .fromTo(
      parallaxSticker,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.1,
      },
      "-=0.3"
    )
    // 스티커들 나타나기 (아주 약간의 시차)
    .fromTo(
      radioSticker,
      {
        opacity: 0,
        scale: 0,
        rotation: -20,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "elastic.out(1, 0.3)",
      },
      "-=0.1"
    )
    .fromTo(
      logoSticker,
      {
        opacity: 0,
        scale: 0,
        rotation: 20,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "elastic.out(1, 0.3)",
      },
      "-=0.3"  // 라디오 스티커보다 0.1초 먼저 시작
    )
    .to(
      radioSticker,
      {
        rotation: 0,
        duration: 0.25,
        ease: "power2.out",
      }
    )
    .to(
      logoSticker,
      {
        rotation: 0,
        duration: 0.25,
        ease: "power2.out",
      },
      "-=0.15"
    )
    .fromTo(
      parallaxTitle,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.2"
    )
    .addLabel("radioControls", "-=0.3")
    .fromTo(
      [parallaxRadioControls, parallaxRadioBtns],
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "radioControls"
    )
    .fromTo(
      firstLine,
      {
        width: "0%",
      },
      {
        width: "calc(100% - 1rem)",
        duration: 12,
        ease: "power1.out",
      },
      "-=0.1"
    )
    .fromTo(
      secondLine,
      {
        width: "calc(100% - 1rem)",
      },
      {
        width: "0%",
        duration: 12,
        ease: "power1.out",
      },
      "<"
    )
    .to(
      parallaxRadioControls, {overflow: "unset"}
    );

  // Parallax 아이템 애니메이션
  const parallax = gsap.timeline({
    scrollTrigger: {
      trigger: parallaxContainer,
      start: () => {
        const settings = getCurrentSettings();
        return `top+=${settings.startPosition} top`;
      },
      end: () => {
        const settings = getCurrentSettings();
        return `top+=${settings.startPosition + settings.endPosition} top`;
      },
      scrub: true,
    },
  });

  parallax
    .to(parallaxItems[0], { y: "-8%" })
    .to(parallaxItems[1], { y: "-24%", x: "-2%" })
    .to(parallaxItems[2], { y: "-10%", scale: 1.05 });
}

parallax();