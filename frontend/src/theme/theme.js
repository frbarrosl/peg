import { createTheme } from '@mui/material/styles'

const softShadow = '0px 4px 20px rgba(0, 0, 0, 0.05)'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0052FF',
      dark: '#003FB3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD700',
    },
    success: {
      main: '#00C853',
    },
    error: {
      main: '#FF3B30',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },

  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  shape: {
    borderRadius: 12,
  },

  shadows: [
    'none',
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
  ],

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },

    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          '&:before': { display: 'none' },
          '&:after': { display: 'none' },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.07)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(0, 82, 255, 0.06)',
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 16,
        },
      },
    },

    MuiPopover: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 12,
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 12,
        },
      },
    },

    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'collapse',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '8px 16px',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 82, 255, 0.04)',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: softShadow,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
})

export default theme
