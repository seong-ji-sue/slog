export default function AboutPage() {
  return (
    <div className="col">
      {/* 이력 요약 */}
      <section className="about-section" data-testid="B-05-text-bio-detail">
        <h2>BIO</h2>
        <p>
          실무에서 발생하는 문제를 파고드는 것을 즐기는 프론트엔드 개발자입니다.
          React · TypeScript · Next.js를 주력으로 사용하며, 삽질의 과정을 빠짐없이 기록합니다.
        </p>
        <p>
          2021년 12월부터 기술 블로그를 운영하며 총 81편의 글을 작성했습니다.
          트러블슈팅 · 딥다이브 · 프로젝트 회고를 주로 다룹니다.
        </p>
      </section>

      {/* 기술 스택 */}
      <section className="about-section" data-testid="B-05-list-stack">
        <h2>STACK</h2>
        <ul className="stack-list">
          <li>React</li>
          <li>TypeScript</li>
          <li>Next.js</li>
          <li>JavaScript</li>
          <li>HTML / CSS</li>
          <li>Git</li>
          <li>Figma</li>
        </ul>
      </section>

      {/* 프로젝트 링크 */}
      <section className="about-section" data-testid="B-05-list-projects">
        <h2>PROJECTS</h2>
        <ul className="project-list">
          <li>
            <a href="https://github.com/seong-ji-sue" target="_blank" rel="noopener noreferrer">
              GitHub 프로필
            </a>
            <span>공개 레포지터리 모음</span>
          </li>
          <li>
            <a href="https://seong-ji-sue.github.io/portfolioPage" target="_blank" rel="noopener noreferrer">
              포트폴리오 페이지
            </a>
            <span>개인 포트폴리오 사이트</span>
          </li>
          <li>
            <a href="https://github.com/seong-ji-sue/react-project-board" target="_blank" rel="noopener noreferrer">
              react-project-board
            </a>
            <span>React 기반 프로젝트 보드</span>
          </li>
        </ul>
      </section>

      {/* 연락처 */}
      <section className="about-section" data-testid="B-05-list-contact">
        <h2>CONTACT</h2>
        <ul className="contact-list">
          <li>
            Email&nbsp;—&nbsp;
            <a href="mailto:contact@example.com">contact@[저자 직접 기입]</a>
          </li>
          <li>
            GitHub&nbsp;—&nbsp;
            <a href="https://github.com/seong-ji-sue" target="_blank" rel="noopener noreferrer">
              @seong-ji-sue
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
