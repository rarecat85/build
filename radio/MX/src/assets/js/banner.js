let bannerScrollTrigger = null;

// 배너 플로팅 함수
function bannerFlolatingAnimation() {
    // 시작 요소 입력 필요
    const startElement = document.querySelector('.overview');
    const endElement = document.querySelector('.banner-main-area-startbtn');
    const test = '../assets/images/lifes-good-campaign-2025-radio-optimism-lgcom-images-parallax-logo-desktop.png';

    // 이전 스크롤 트리거 요소 제거
    gsap.set(endElement, {
        clearProps: 'transform'
    });

    if (bannerScrollTrigger) {
        bannerScrollTrigger.kill();
    }

    // 시작 요소의 위치, 끝 요소 위치 계산값
    const startDetailPosition = startElement.getBoundingClientRect().bottom + window.scrollY;
    const endDetailPosition = endElement.getBoundingClientRect().top + window.scrollY;


    // 시작 요소와 끝 요소간의 거리 계산값 
    const distance = Math.abs(endDetailPosition - startDetailPosition);

    bannerScrollTrigger = gsap.from(endElement, {
        y: -distance,
        ease: 'none',
        scrollTrigger: {
            trigger: startElement,
            start: 'bottom 90%',
            end: `+=${distance} 90.1%`,
            scrub: true,
        }
    })
}

// 리사이즈 함수 
function handleResize() {
    bannerFlolatingAnimation();
}

// 디바운스 함수
function debounce(func, delay = 500) {
    let timer;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    }
}

// 배너 init 함수
function initBanner() {
    bannerFlolatingAnimation();
    // bannerMusicControlAnimation();

    window.addEventListener('resize', debounce(handleResize));

    window.addEventListener('load', () => {
        document.querySelector('body').classList.remove('noscroll');
    })
}

initBanner();