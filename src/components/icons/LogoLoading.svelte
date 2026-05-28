<script>
	import { onMount } from 'svelte';

	let animationClass = 'draw';

	const duration = 3000;
	const delay = 1000;

	function startAnimation() {
		animationClass = 'draw'; // Add class to start animation
		setTimeout(resetAnimation, duration);
	}

	function resetAnimation() {
		animationClass = ''; // Remove class to reset animation
		setTimeout(startAnimation, delay);
	}

	// Start the loop when component is mounted
	onMount(() => {
		resetAnimation();
	});
</script>
<style>
    .fake {
        fill: none;
        stroke-width: 30;
        stroke-linecap: round;
        stroke-dasharray: 500;
        stroke-dashoffset: 0;
    }

    .draw {
        animation: draw 2s ease-in-out reverse;
    }

    @keyframes draw {
        to {
            stroke-dashoffset: 1000;
        }
    }
</style>

<svg class="stroke-black dark:stroke-white" viewBox="0 0 246.89 242.69">
	<defs>
		<mask id="logo-mask">
			<rect width="100%" height="100%" fill="black"/>
			<path fill="white" d="M236.67,198.43c-5.28,7.78-11.3,14.98-17.93,21.52l-21.09-21.09c-21.12,20.82-50.07,33.6-81.64,33.55C14.54,234.66-38.98,103.97,33.27,34.49l21.04,21.03C.75,107.31,40.6,204.3,116.02,202.65c23.42.14,44.87-9.46,60.56-24.86,6.73-6.62,12.4-14.31,16.69-22.76l43.4,43.4Z"/>
			<path fill="white" d="M116.01,29.6c-1.16,0-2.32.02-3.48.08,19,22.29,65.08,52.37,62.16,86.45.25,31.77-26.43,58.94-58.69,58.69-51.02,1.11-78.13-64.42-42.02-99.6l19.67,19.67c-18.6,18.61-4.32,52.68,22.35,52.09,25.78.87,40.61-32.36,23.32-51.03-20.46-20.53-60.18-60.15-80.84-80.85C101.89-11.11,163.78-2.09,197.86,33.59l-21.03,21.03c-15.64-15.47-37.12-25.03-60.81-25.03Z"/>
		</mask>
	</defs>
	<g mask="url(#logo-mask)">
		<path class="fake {animationClass}" d="M43.92,45.13c-62.91,60.63-16.22,174.47,72.22,172.52,20.59.09,43.08-7.46,58.51-18.78,6.65-4.88,9.93-7.09,13.75-11.31,6.97-7.69,5.89-23.56,9.58-16,4.98,10.19,12.42,20.11,21.42,29.22l8.43,8.53"/>
		<path class="fake {animationClass}" d="M83.95,85.17c-27.36,26.89-6.66,76.7,32.18,75.85,22.9.51,43.04-24.75,44.71-38.01,1.63-16.3-.27-18.43-5.56-28.11-10.33-14.96-18.87-21.28-33.89-37.56-20.78-27.62-86.1-39.3-23.89-42.5,7.73-.4,12.38-.28,16.37.06,1.29.11,8.02.31,11.67.59,19.16,1.48,44.69,11.16,61.91,28.75"/>
	</g>
</svg>