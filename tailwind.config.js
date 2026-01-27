/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Mad Max Gas Town palette
				rust: {
					50: '#fef6f3',
					100: '#fde8e1',
					200: '#fcd5c7',
					300: '#f9b8a0',
					400: '#f4906c',
					500: '#eb6b3f',  // Primary rust orange
					600: '#d84f25',
					700: '#b43e1c',
					800: '#94351c',
					900: '#7a301c',
					950: '#42160b'
				},
				oil: {
					50: '#f6f6f6',
					100: '#e7e7e7',
					200: '#d1d1d1',
					300: '#b0b0b0',
					400: '#888888',
					500: '#6d6d6d',
					600: '#5d5d5d',
					700: '#4f4f4f',
					800: '#454545',
					900: '#3d3d3d',
					950: '#1a1a1a'  // Deep oil black
				},
				chrome: {
					50: '#f8f9fa',
					100: '#eef0f2',
					200: '#dde1e6',
					300: '#c6ccd4',
					400: '#a8b1bd',
					500: '#8f99a8',  // Chrome silver
					600: '#7a8391',
					700: '#6b7280',
					800: '#5a606b',
					900: '#4d5259',
					950: '#2f3237'
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',  // Warning yellow
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
					950: '#451a03'
				},
				flame: {
					50: '#fff7ed',
					100: '#ffedd5',
					200: '#fed7aa',
					300: '#fdba74',
					400: '#fb923c',
					500: '#f97316',  // Flame orange
					600: '#ea580c',
					700: '#c2410c',
					800: '#9a3412',
					900: '#7c2d12',
					950: '#431407'
				},
				exhaust: {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6b7280',  // Exhaust grey
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827',
					950: '#030712'
				}
			},
			fontFamily: {
				display: ['Space Grotesk', 'sans-serif'],
				body: ['Inter', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
				stencil: ['Bebas Neue', 'sans-serif']
			},
			backgroundImage: {
				'hazard-stripes': 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #1a1a1a 10px, #1a1a1a 20px)',
				'metal-texture': 'linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 50%, #3d3d3d 100%)',
				'rust-gradient': 'linear-gradient(180deg, #b43e1c 0%, #7a301c 100%)'
			},
			boxShadow: {
				'glow-rust': '0 0 20px rgba(235, 107, 63, 0.4)',
				'glow-warning': '0 0 20px rgba(251, 191, 36, 0.4)',
				'inset-metal': 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'flicker': 'flicker 0.5s ease-in-out infinite'
			},
			keyframes: {
				flicker: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			}
		}
	},
	plugins: []
};
