import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#96EDFC',
  				'100': '#82EAFB',
  				'200': '#5AE3FA',
  				'300': '#32DCF9',
  				'400': '#0BD6F8',
  				'500': '#06B6D4',
  				'600': '#04879D',
  				'700': '#035867',
  				'800': '#012930',
  				'900': '#000000',
  				'950': '#000000',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#CEF6EF',
  				'100': '#BDF3E9',
  				'200': '#9AEDDE',
  				'300': '#77E7D3',
  				'400': '#55E1C7',
  				'500': '#32DBBC',
  				'600': '#20B59A',
  				'700': '#178571',
  				'800': '#0F5649',
  				'900': '#072620',
  				'950': '#020E0C',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			'slide-in-from-top': {
  				'0%': {
  					transform: 'translateY(-100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-from-bottom': {
  				'0%': {
  					transform: 'translateY(100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
  			'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out'
  		}
  	}
  },
  plugins: [animate, require("tailwindcss-animate")],
};

export default config;

