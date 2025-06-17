const soundSwiper = document.querySelector(".sound .sound-swiper");

if (soundSwiper) {
    const trackTimelines = {};
    const trackStarted = {};

    // 미디어 쿼리 설정
    const mediaQueries = {
        mobile: window.matchMedia("(max-width: 768px)"),
        tablet: window.matchMedia("(min-width: 769px) and (max-width: 1440px)"),
        desktop: window.matchMedia("(min-width: 1441px)")
    };

    // 디바이스별 간격 업데이트 함수
    function updateExtraPadding() {
        const swiperWrapper = document.querySelector(".sound .swiper-wrapper");

        if (mediaQueries.tablet.matches) {
            swiperWrapper.style.paddingLeft = "120px";
        } else if (mediaQueries.desktop.matches) {
            swiperWrapper.style.paddingLeft = "150px";
        } else {
            resetExtraPadding();
        }
    }

    // 디바이스별 간격 업데이트 함수
    function resetExtraPadding() {
        const swiperWrapper = document.querySelector(".sound .swiper-wrapper");
        swiperWrapper.style.paddingLeft = "0px";
    }

    const audioControllerBtns = document.querySelectorAll(".sound-txtbx-controllers-btn");
    const progressFills = document.querySelectorAll(".progress-fill");
    const progressCircles = document.querySelectorAll(".progress-circle");

    // 초기화 함수(슬라이드 변경시)
    function resetAll() {
        const audios = document.querySelectorAll("audio");

        // 오디오 초기화
        audios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });

        // 타임라인 초기화 
        Object.values(trackTimelines).forEach(tl => {
            tl.pause();
            tl.timeScale(0);
        });

        // 컨트롤러 초기화 
        audioControllerBtns.forEach(btn => {
            btn.setAttribute("aria-pressed", "false");
            btn.setAttribute("aria-label", "play");
        });

        // 컨트롤러 프로그래스바 초기화 
        progressFills.forEach(fill => fill.style.width = "0%");
        progressCircles.forEach(circle => circle.style.left = "0%");
    }

    // 오디오 컨트롤러 함수 
    function handleAudio() {
        const controllers = document.querySelectorAll(".sound-txtbx-controllers[role='group']");

        controllers.forEach((group, idx) => {
            const audioControllerBtn = group.querySelector(".sound-txtbx-controllers-btn");
            const progressBar = group.querySelector(".progress-bar");
            const progressCricle = group.querySelector(".progress-circle");
            const volumeBtn = group.querySelector(".volume-btn");
            const audioId = audioControllerBtn.getAttribute("aria-controls");
            const audio = document.getElementById(audioId);

            // 초기화
            audio.pause();
            audio.muted = false;
            audioControllerBtn.setAttribute("aria-pressed", "false");
            audioControllerBtn.setAttribute("aria-label", "play");
            volumeBtn.setAttribute("aria-pressed", "false");
            volumeBtn.setAttribute("aria-label", "mute");
            progressCricle.setAttribute("aria-valuemin", "0");
            progressCricle.setAttribute("aria-valuemax", "100");
            progressCricle.setAttribute("aria-valuenow", "0");
            progressCricle.setAttribute("aria-valuetext", "0%");

            // 컨트롤러 버튼 클릭 이벤트
            audioControllerBtn.addEventListener("click", () => {
                if (audio.paused) {
                    audio.play().catch(() => {});
                    audioControllerBtn.setAttribute("aria-pressed", "true");
                    audioControllerBtn.setAttribute("aria-label", "pause");
                    soundTrackAnimation(idx, false);
                    soundTitleAnimation(idx, false);
                } else {
                    audio.pause();
                    audioControllerBtn.setAttribute("aria-pressed", "false");
                    audioControllerBtn.setAttribute("aria-label", "play");
                    soundTrackAnimation(idx, true);
                    soundTitleAnimation(idx, true);
                }
            });

            // 오디오 타임라인 업데이트 이벤트
            audio.addEventListener("timeupdate", () => {
                const percentage = (audio.currentTime / audio.duration) * 100;

                progressCricle.style.left = percentage + "%";

                const fill = group.querySelector(".progress-fill");
                fill.style.width = percentage + "%";

                progressCricle.setAttribute("aria-valuenow", Math.floor(percentage));
                progressCricle.setAttribute("aria-valuetext", `${Math.floor(percentage)}%`);

                if (percentage >= 100) {
                    audioControllerBtn.setAttribute("aria-pressed", "false");
                    audioControllerBtn.setAttribute("aria-label", "play");
                    soundTrackAnimation(idx, true);
                    soundTitleAnimation(idx, true);
                }
            });

            // 프로그래스바 마우스 이벤트
            let isProgressDragging = false;
            let lastTime = 0;

            progressBar.addEventListener("pointerdown", (e) => {
                soundSwiper.allowTouchMove = false;
                e.stopPropagation();
                isProgressDragging = true;
                audioTimeUpdate(e);
            });

            document.addEventListener("pointermove", (e) => {
                if (isProgressDragging) {
                    const now = new Date().getTime();
                    if (now - lastTime >= 30) {
                        audioTimeUpdate(e);
                        lastTime = now;
                    }
                }
            });

            document.addEventListener("pointerup", () => {
                if (isProgressDragging) {
                    soundSwiper.allowTouchMove = true;
                    isProgressDragging = false;
                }
            });

            function audioTimeUpdate(e) {
                const rect = progressBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                audio.currentTime = percentage * audio.duration;
            }

            // 뮤트/언뮤트 클릭 이벤트
            volumeBtn.addEventListener("click", () => {
                audio.muted = !audio.muted;
                const muted = audio.muted;
                volumeBtn.setAttribute("aria-pressed", muted.toString());
                volumeBtn.setAttribute("aria-label", muted ? "unmute" : "mute");
            });
        });
    }

    // LP 회전 함수
    function soundTrackAnimation(index = 0, isStopped = false) {
        const activeContainer = document.querySelector('.sound-img-active');
        const track = activeContainer.querySelector('.sound-imgbx-track');

        // 현재 슬라이드 타임라인 
        if (!trackTimelines[index]) {
            const tl = gsap.timeline({
                    paused: true,
                    repeat: -1,
                })
                .to(track, {
                    rotation: "+=360",
                    duration: 2,
                    ease: "none"
                });
            tl.timeScale(0);
            trackTimelines[index] = tl;
        }
        const tl = trackTimelines[index];

        // 오디오 길이 계산
        const playBtn = document.querySelectorAll(".sound-txtbx-controllers-btn")[index];
        const audio = document.getElementById(playBtn.getAttribute("aria-controls"));
        const accel = 2; // 가속 
        const decel = 2; // 감속 
        const total = audio.duration || accel + decel;
        const delay = Math.max(0, total - decel);

        // 재생 버튼을 눌렀다면 
        if (!isStopped) {
            if (!trackStarted[index]) {
                trackStarted[index] = true;

                tl.play();

                gsap.to(tl, {
                    timeScale: 1,
                    duration: decel,
                    ease: "power2.in"
                });

                gsap.to(tl, {
                    timeScale: 0,
                    duration: accel,
                    delay: delay,
                    ease: "power2.out",
                    onComplete: () => tl.pause()
                });
            } else {
                tl.play();
            }
            // 정지 버튼을 눌렀다면
        } else {
            tl.pause();
        }
    }

    // 타이틀 애니메이션 함수
    function soundTitleAnimation(index = 0, isStopped = true) {
        const titleWrappers = document.querySelectorAll(".sound-txtbx-title-wrapper");
        const titleWrappersIdx = titleWrappers[index];

        // 순수 텍스트 넓이
        const instantContainer = document.createElement("span");
        instantContainer.style.font = window.getComputedStyle(titleWrappersIdx).font;
        instantContainer.innerText = titleWrappersIdx.innerText;
        document.body.appendChild(instantContainer);
        const pureTextWidth = instantContainer.offsetWidth;
        document.body.removeChild(instantContainer);

        // 타이틀 넓이가 컨테이너보다 작다면 애니메이션 중지
        if (titleWrappersIdx.offsetWidth >= pureTextWidth) {
            isStopped = true;
        } else {
            // "타이틀 - 갭 - 타이틀" 형식으로 dataset 추가
            if (!titleWrappersIdx.dataset.original) {
                titleWrappersIdx.dataset.original = titleWrappersIdx.innerHTML;
                titleWrappersIdx.innerHTML = `<span class="repeat-text">${titleWrappersIdx.dataset.original}</span><span class="repeat-gap"></span><span class="repeat-text">${titleWrappersIdx.dataset.original}</span>`;
            }

            const repeatTexts = titleWrappersIdx.querySelectorAll(".repeat-text");
            const repeatGap = titleWrappersIdx.querySelector(".repeat-gap");
            const textWidth = repeatTexts[0].offsetWidth + repeatGap.offsetWidth;
            const speed = 100;
            const duration = textWidth / speed;

            function animateRepeat() {
                gsap.fromTo(
                    titleWrappersIdx, {
                        x: 0,
                    }, {
                        x: -textWidth,
                        ease: "none",
                        duration: duration,
                        repeat: -1,
                    }
                );
            }
        }

        if (isStopped) {
            gsap.killTweensOf(titleWrappersIdx);
            gsap.set(titleWrappersIdx, {
                x: 0,
            });
        } else {
            gsap.killTweensOf(titleWrappersIdx);
            animateRepeat();
        }
    }

    // 슬라이드 화살표 위치 조정 함수(앨범 높이의 중앙 위치하도록)
    function moveCenterNavigation() {
        const soundSwiper = document.querySelector('.sound-swiper');
        const swiperNavigation = document.querySelector(".sound .swiper-navigation");
        const album = document.querySelector('.swiper-slide-active .sound-imgbx-album');

        const navigationPosition = (album.getBoundingClientRect().top - soundSwiper.getBoundingClientRect().top) + (album.getBoundingClientRect().height / 2);
        swiperNavigation.style.top = `${navigationPosition}px `;
    }

    const soundTexts = document.querySelectorAll(".sound .swiper-slide .sound-txtbx");

    // Sound Swiper 초기화 및 설정
    const swiperOptions = {
        slidesPerView: 1,
        centeredSlides: true,
        slideToClickedSlide: true,
        touchable: true,
        speed: 500,
        allowTouchMove: true,
        pagination: {
            el: ".sound .swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        on: {
            init: function () {
                soundTexts[0].classList.add("active");

                // 첫 번째 슬라이드의 sound-imgbx를 sound-img-active로 복사
                const firstSlide = this.slides[0];
                const firstImgBx = firstSlide.querySelector('.sound-imgbx');
                const activeContainer = document.querySelector('.sound-img-active');
                
                if (firstImgBx && activeContainer) {
                    const clonedImgBx = firstImgBx.cloneNode(true);
                    activeContainer.innerHTML = '';
                    activeContainer.appendChild(clonedImgBx);
                    
                    // 새로 들어온 요소에만 페이드인 효과 적용
                    gsap.fromTo(clonedImgBx, 
                        { opacity: 0 },
                        { opacity: 1, duration: 0.5, ease: "power2.out" }
                    );
                }

                handleAudio();
                moveCenterNavigation();
                resetExtraPadding();
            },

            slideChange: function () {
                soundTexts.forEach(el => el.classList.remove("active"));

                const index_currentSlide = this.realIndex;
                const currentSlide = this.slides[index_currentSlide];
            },

            activeIndexChange: function () {
                console.log('activeIndexChange triggered');
                
                // 현재 활성화된 슬라이드 찾기
                const activeSlide = this.slides[this.activeIndex];
                console.log('Active slide:', activeSlide);
                
                if (!activeSlide) {
                    console.log('No active slide found');
                    return;
                }

                // sound-imgbx 찾기
                const activeImgBx = activeSlide.querySelector('.sound-imgbx');
                console.log('Active imgBx:', activeImgBx);
                

                // 활성 컨테이너 찾기
                const activeContainer = document.querySelector('.sound-img-active');
                

                try {
                    // 기존 요소 저장
                    const oldImgBx = activeContainer.querySelector('.sound-imgbx');
                    
                    // 새로운 요소 생성 및 추가
                    const clonedImgBx = activeImgBx.cloneNode(true);
                    clonedImgBx.style.opacity = '0';
                    activeContainer.appendChild(clonedImgBx);
                    
                    // 새로 들어온 요소에 페이드인 효과 적용
                    gsap.to(clonedImgBx, {
                        opacity: 1,
                        duration: 0.5,
                        ease: "power2.out",
                        onComplete: () => {
                            // 페이드인 완료 후 기존 요소 제거
                            if (oldImgBx) {
                                oldImgBx.remove();
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('Error copying imgBx:', error);
                }
            },

            // afterSlideChangeStart: function () {}
        },
        breakpoints: {
            769: {
                slidesPerView: 'auto',
                centeredSlides: true,
            },
        },
    }

    let swiperInstance = new Swiper(soundSwiper, swiperOptions);


    function initTxtSwiper() {
        const txtSwiper = document.querySelector('.sound-txt-swiper');
        if (txtSwiper) {
            const textSwiper = new Swiper(txtSwiper, {
                slidesPerView: 1,
                speed: 500,
                allowTouchMove: true,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                controller: {
                    control: swiperInstance
                },
                on: {
                    slideChange() {
                        resetAll();
                        soundTitleAnimation(this.realIndex, true);
                        swiperInstance.slideTo(this.realIndex);
                        moveCenterNavigation();
                    }
                }
            });

            swiperInstance.controller.control = textSwiper;
        }
    }

    initTxtSwiper();

    function handleSwiperResize() {
        if (swiperInstance.realIndex >= 1) {
            soundTexts.forEach(el => el.classList.remove("active"));

            swiperInstance.destroy(true, true);
            swiperInstance = new Swiper(soundSwiper, swiperOptions);

            initTxtSwiper();

            // 현재 활성 슬라이드의 이미지 복사
            const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
            const activeImgBx = activeSlide.querySelector('.sound-imgbx');
            const activeContainer = document.querySelector('.sound-img-active');
            
            if (activeImgBx && activeContainer) {
                // 기존 요소 저장
                const oldImgBx = activeContainer.querySelector('.sound-imgbx');
                
                // 새로운 요소 생성 및 추가
                const clonedImgBx = activeImgBx.cloneNode(true);
                clonedImgBx.style.opacity = '0';
                activeContainer.appendChild(clonedImgBx);
                
                // 새로 들어온 요소에 페이드인 효과 적용
                gsap.to(clonedImgBx, {
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.out",
                    onComplete: () => {
                        // 페이드인 완료 후 기존 요소 제거
                        if (oldImgBx) {
                            oldImgBx.remove();
                        }
                    }
                });
            }

            handleAudio();
            soundTitleAnimation(0, true);
        }

        moveCenterNavigation();
    }

    window.addEventListener('resize', debounce(handleSwiperResize, 250)); // 디바운스 시간을 250ms로 증가
}



// 리사이즈 함수
function handleResize() {
    moveCenterNavigation();
}

// 디바운스 함수
function debounce(func, delay = 100) {
    let timer;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    }
}

// Sound 섹션 init 함수
function initSound() {
    moveCenterNavigation();
    window.addEventListener('resize', debounce(handleResize));
}


initSound();