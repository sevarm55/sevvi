#!/usr/bin/env zsh
# Sevvi first-run setup — checks dependencies and offers to install

# Only run once per machine
[[ -f "$HOME/.sevvi-setup-done" ]] && return 0

_sevvi_setup() {
  local missing=()

  # Check Homebrew
  if ! command -v brew &>/dev/null; then
    missing+=("brew")
  fi

  # Check Oh My Zsh
  if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
    missing+=("ohmyzsh")
  fi

  # Check Nerd Font
  if ! ls ~/Library/Fonts/*NerdFont* &>/dev/null 2>&1 && ! ls ~/Library/Fonts/*Nerd\ Font* &>/dev/null 2>&1; then
    missing+=("nerdfont")
  fi

  # Nothing missing — mark as done
  if (( ${#missing[@]} == 0 )); then
    touch "$HOME/.sevvi-setup-done"
    return 0
  fi

  # Show setup prompt
  echo ""
  echo "\033[1;35m  ╔═══════════════════════════════════════╗\033[0m"
  echo "\033[1;35m  ║     Welcome to Sevvi Terminal!        ║\033[0m"
  echo "\033[1;35m  ╚═══════════════════════════════════════╝\033[0m"
  echo ""

  if [[ " ${missing[*]} " == *" brew "* ]]; then
    echo "  \033[33m⚠\033[0m  Homebrew not found"
  fi
  if [[ " ${missing[*]} " == *" ohmyzsh "* ]]; then
    echo "  \033[33m⚠\033[0m  Oh My Zsh not found"
  fi
  if [[ " ${missing[*]} " == *" nerdfont "* ]]; then
    echo "  \033[33m⚠\033[0m  Nerd Font not found (icons may not display)"
  fi

  echo ""
  echo "  \033[36mWould you like to install missing dependencies?\033[0m"
  echo "  \033[90mPress \033[1;97mY\033[0;90m to install, \033[1;97mN\033[0;90m to skip\033[0m"
  echo ""

  read -k1 "reply?  > "
  echo ""

  if [[ "$reply" != [yY] ]]; then
    echo ""
    echo "  \033[90mSkipped. You can install later by running: \033[37msevvi-setup\033[0m"
    echo ""
    touch "$HOME/.sevvi-setup-done"
    return 0
  fi

  echo ""

  # Install Homebrew
  if [[ " ${missing[*]} " == *" brew "* ]]; then
    echo "  \033[36m→ Installing Homebrew...\033[0m"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Add brew to PATH for current session
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
    echo "  \033[32m✓ Homebrew installed\033[0m"
    echo ""
  fi

  # Install Oh My Zsh
  if [[ " ${missing[*]} " == *" ohmyzsh "* ]]; then
    echo "  \033[36m→ Installing Oh My Zsh...\033[0m"
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    echo "  \033[32m✓ Oh My Zsh installed\033[0m"
    echo ""
  fi

  # Install Nerd Font
  if [[ " ${missing[*]} " == *" nerdfont "* ]]; then
    if command -v brew &>/dev/null; then
      echo "  \033[36m→ Installing JetBrainsMono Nerd Font...\033[0m"
      brew install --cask font-jetbrains-mono-nerd-font 2>/dev/null
      echo "  \033[32m✓ Nerd Font installed\033[0m"
    else
      echo "  \033[33m⚠ Skipping Nerd Font (needs Homebrew)\033[0m"
    fi
    echo ""
  fi

  touch "$HOME/.sevvi-setup-done"

  echo "  \033[1;32m✓ Setup complete!\033[0m"
  echo "  \033[90mRestart Sevvi to apply all changes.\033[0m"
  echo ""
}

# Make it callable as a command too
sevvi-setup() { rm -f "$HOME/.sevvi-setup-done"; _sevvi_setup; }

# Run on first load
_sevvi_setup
