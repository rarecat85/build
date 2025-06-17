function overviewAnimation() { 
  const highlightElement = document.querySelector('.radio-highlight');
  
  if (highlightElement) {
    const originalText = highlightElement.textContent;
    
    const wrappedText = originalText.split('').map(char => {
      if (char === ' ') {
        return `<span class="split-char space-char">&nbsp;</span>`;
      } else {
        return `<span class="split-char">${char}</span>`;
      }
    }).join('');
    
    highlightElement.innerHTML = wrappedText;
    
    const allChars = highlightElement.querySelectorAll('.split-char');
    
    gsap.set(allChars,{backgroundColor:'transparent'})
    gsap.to(allChars, {
      backgroundColor: '#fff082', 
      ease: "linear",
      stagger: {
        amount: 0.4, 
        from: "start"
      },
      scrollTrigger: {
        trigger: highlightElement,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "restart none none none"
      }
    });
  }
  
  // ScrollTrigger 인스턴스들을 저장할 배열
  let motionIconScrollTriggers = [];
  
  // Motion icons 애니메이션 함수 분리
  function setupMotionIconsAnimation() {
    const motionIcons = document.querySelectorAll('.motion-icon');
    
    if (motionIcons.length > 0) {
      console.log('Setting up motion icons animation'); // 디버깅용
      
      // 기존 애니메이션과 ScrollTrigger 완전히 정리
      gsap.killTweensOf(motionIcons);
      
      // 기존 ScrollTrigger들 정리
      motionIconScrollTriggers.forEach(st => st.kill());
      motionIconScrollTriggers = [];
      
      // motionIcons 위치와 스타일 완전히 초기화
      gsap.set(motionIcons, {
        clearProps: "all", // 모든 인라인 스타일 제거
        visibility: 'hidden', // 처음에는 숨김
        y: 0,
        x: 0,
        rotation: 0,
        scale: 1
      });
      
      // 순차적으로 나타나는 애니메이션
      const appearTween = gsap.to(motionIcons, {
        visibility: 'visible',
        duration: 0.6,
        y: "-=10",
        stagger: {
          amount: 0.8, 
          from: "random"
        },
        scrollTrigger: {
          trigger: '.overview-heading-img',
          start: "top 50%",
          end: "bottom 30%",
          toggleActions: "play none none reverse",
          onToggle: self => console.log('ScrollTrigger toggled:', self.isActive) // 디버깅용
        },
        delay: 0.5
      });
      
      // ScrollTrigger 인스턴스 저장
      if (appearTween.scrollTrigger) {
        motionIconScrollTriggers.push(appearTween.scrollTrigger);
      }
      
      // 추가 효과: 살짝 떠다니는 애니메이션
      motionIcons.forEach((icon, index) => {
        gsap.to(icon, {
          y: "-=8",
          rotation: index % 2 === 0 ? 1.5 : -1.5, 
          duration: 3 + (index * 0.2), 
          ease: "power1.inOut", 
          yoyo: true,
          repeat: -1,
          delay: index * 0.3 
        });
      });
    }
  }
  
  // 초기 애니메이션 실행
  setupMotionIconsAnimation();
  
  // 리사이즈 이벤트 핸들러
  let currentBreakpoint = getCurrentBreakpoint();
  
  function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < 769) return 'mobile';
    if (width < 1441) return 'tablet';
    return 'desktop';
  }
  
  function handleResize() {
    const newBreakpoint = getCurrentBreakpoint();
    
    console.log(`Resize detected: ${currentBreakpoint} -> ${newBreakpoint}`); // 디버깅용
    
    // mobile, tablet 구간에서는 매번 리프레시, desktop 구간에서는 브레이크포인트 변경시에만
    const shouldRefresh = (newBreakpoint === 'mobile' || newBreakpoint === 'tablet') || 
                         (newBreakpoint !== currentBreakpoint);
    
    if (shouldRefresh) {
      currentBreakpoint = newBreakpoint;
      
      console.log(`Reinitializing animations - Current: ${newBreakpoint}`); // 디버깅용
      
      // ScrollTrigger 전체 새로고침
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
      
      // 약간의 지연 후 motionIcons 애니메이션 재실행
      setTimeout(() => {
        setupMotionIconsAnimation();
      }, 50);
    }
  }
  
  // 디바운스 함수
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 리사이즈 이벤트 리스너 추가 (디바운스 적용)
  window.addEventListener('resize', debounce(handleResize, 150));
  
  // 페이지 로드 완료 후에도 한 번 더 실행 (안전장치)
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
      setupMotionIconsAnimation();
    }, 100);
  });
}

overviewAnimation();