/**
 * 클라이언트 컴포넌트 중앙 관리
 * 서버 컴포넌트에서 사용되는 클라이언트 컴포넌트를 여기에 export
 * main.ts에서 자동으로 등록할 수 있습니다
 */

export { default as Counter } from "./Counter.js";
export { default as LikeButton } from "./LikeButton.js";

// 필요에 따라 다른 클라이언트 컴포넌트도 추가할 수 있습니다
// export { default as OtherComponent } from "./OtherComponent.js";
