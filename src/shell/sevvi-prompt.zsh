#!/usr/bin/env zsh
# Sevvi Prompt Engine — 21 unique styles
unset POWERLEVEL9K_INSTANT_PROMPT
typeset -g POWERLEVEL9K_INSTANT_PROMPT=off 2>/dev/null
zmodload zsh/datetime 2>/dev/null

# ── Powerline glyphs ────────────────────────
typeset -g _R=$'\uE0B0' _RS=$'\uE0B1' _RR=$'\uE0B4'
typeset -g _PBG=""
_pb() { _PBG=""; }
_ps() {
  local bg=$1 fg=$2 t=$3 o="" bc fc
  (( bg<8 )) && bc=$((40+bg)) || bc=$((100+bg-8))
  (( fg<8 )) && fc=$((30+fg)) || fc=$((90+fg-8))
  if [[ -z "$_PBG" ]]; then o+="%{\e[${bc}m\e[${fc}m%} ${t} %{\e[0m%}"
  elif [[ "$_PBG" != "$bg" ]]; then
    local pc; (( _PBG<8 )) && pc=$((30+_PBG)) || pc=$((90+_PBG-8))
    o+="%{\e[${bc}m\e[${pc}m%}${_R}%{\e[${fc}m%} ${t} %{\e[0m%}"
  else o+="%{\e[${bc}m\e[${fc}m%}${_RS} ${t} %{\e[0m%}"; fi
  _PBG=$bg; echo -n "$o"
}
_pe() { [[ -n "$_PBG" ]] && { local c; (( _PBG<8 )) && c=$((30+_PBG)) || c=$((90+_PBG-8)); echo -n "%{\e[0m\e[${c}m%}${_R}%{\e[0m%}"; }; _PBG=""; }

# ── Shared data ─────────────────────────────
_d()  { print -P '%2~'; }
_fp() { print -P '%~'; }
_g() {
  git rev-parse --is-inside-work-tree &>/dev/null || return 1
  local b=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
  [[ -z "$b" ]] && return 1
  local s=$(git status --porcelain 2>/dev/null)
  typeset -g _GB="$b" _GM=0 _GS=0 _GU=0 _GD=0
  if [[ -n "$s" ]]; then
    _GD=1; _GM=$(echo "$s"|grep -c '^ [MD]\|^MM\|^AM'); _GS=$(echo "$s"|grep -c '^[MADRC] '); _GU=$(echo "$s"|grep -c '^??')
  fi
}
_gs() { local i="$_GB"; ((_GM>0))&&i+=" *$_GM"; ((_GS>0))&&i+=" +$_GS"; ((_GU>0))&&i+=" ?$_GU"; echo -n "$i"; }
_nd() { [[ -f package.json||-f .nvmrc||-d node_modules ]] || return 1; node -v 2>/dev/null; }
_py() { [[ -f requirements.txt||-f setup.py||-f pyproject.toml||-d .venv||-n "$VIRTUAL_ENV" ]] || return 1; python3 --version 2>/dev/null|cut -d' ' -f2; }
_tm() {
  [[ -z "$_sevvi_cmd_start" ]] && return 1
  local e=$((EPOCHSECONDS-_sevvi_cmd_start)); unset _sevvi_cmd_start; ((e<3))&&return 1
  ((e>=3600)) && echo -n "$((e/3600))h$((e%3600/60))m" || { ((e>=60)) && echo -n "$((e/60))m$((e%60))s" || echo -n "${e}s"; }
}
C() { echo -n "%{\e[${1}m%}"; }
R() { echo -n "%{\e[0m%}"; }
B() { echo -n "%{\e[1m%}"; }

# ══════════════════════════════════════════════
# 1. POWERLINE — Default, don't touch
_build_powerline() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "x $_sevvi_exit"
  _ps 5 15 "$(_d)"; _g && { ((_GD)) && _ps 3 0 "$(_gs)" || _ps 2 0 "$_GB ok"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "$n"
  local t=$(_tm); [[ -n "$t" ]] && _ps 8 7 "$t"
  _pe; echo
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)$(B)>$(R) " || echo -n "$(C 31)$(B)>$(R) "
}

# 2. GLITCH — Broken/distorted cyberpunk feel
_build_glitch() {
  echo -n "$(C 91)▌$(R)$(C 93)▍$(C 92)▎$(R) "
  echo -n "$(C '1;96')$(_d)$(R)"
  _g && echo -n " $(C 90)//$(R) $(C '1;93')$_GB$(R)" && ((_GD)) && echo -n "$(C 91)!$(R)"
  echo; echo -n "$(C 91)▸$(R) "
}

# 3. TYPEWRITER — Monospaced, mechanical feel
_build_typewriter() {
  echo -n "$(C 37).-=[ $(C '1;97')$(_fp)$(C 37) ]=-."
  _g && echo -n " $(C 37){$(C 33)$_GB$(C 37)}$(R)"
  echo; echo -n "$(C 37)>> $(R)"
}

# 4. RADAR — Military/tech scanner
_build_radar() {
  echo -n "$(C 32)[$(_d)] $(C 90)::$(R)"
  _g && echo -n " $(C 33)BRANCH:$_GB$(R)" && ((_GD)) && echo -n " $(C 31)MODIFIED$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 36)RT:$n$(R)"
  echo; echo -n "$(C 32)>_ $(R)"
}

# 5. WAVE — Ocean-inspired flowing
_build_wave() {
  echo -n "$(C 36)~$(C 96)~$(C '1;36')~$(R) $(C '1;96')$(_d)$(R)"
  _g && echo -n " $(C 36)~$(R) $(C 94)$_GB$(R)" && ((_GD)) && echo -n "$(C 93)*$(R)"
  echo; echo -n "$(C 36)~$(R) "
}

# 6. PIXEL — 8-bit retro game style
_build_pixel() {
  echo -n "$(C 92)>>$(R) $(C '1;97')$(_d)$(R)"
  _g && echo -n " $(C 93)P1:$_GB$(R)" && ((_GD)) && echo -n " $(C 91)DMG:$_GM$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 92)LV:$n$(R)"
  echo; echo -n "$(C 92)>>$(R) "
}

# 7. NOIR — Dark detective minimal
_build_noir() {
  echo -n "$(C 90)_$(R) $(C 37)$(_d)$(R)"
  _g && echo -n "$(C 90) | $(C 37)$_GB$(R)" && ((_GD)) && echo -n "$(C 90)~$(R)"
  echo; echo -n "$(C 90)_$(R) "
}

# 8. TOKYO — Neon city signs
_build_tokyo() {
  echo -n "$(C 95)$(B)「$(R)$(C '1;96')$(_d)$(C 95)$(B)」$(R)"
  _g && echo -n "$(C 95)$(B)「$(R)$(C '1;93')$_GB$(R)" && ((_GD)) && echo -n " $(C 91)×$_GM$(R)"
  _g && echo -n "$(C 95)$(B)」$(R)"
  echo; echo -n "$(C 95)$(B)→$(R) "
}

# 9. DNA — Double helix inspired
_build_dna() {
  echo -n "$(C 35)╔$(C 36)═$(C 35)╗$(R) $(C 96)$(_d)$(R)"
  _g && echo -n " $(C 35)╠$(R) $(C 93)$_GB$(R)" && ((_GD)) && echo -n "$(C 91)~$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 35)╠$(R) $(C 92)$n$(R)"
  echo; echo -n "$(C 35)╚$(C 36)═$(C 35)╝$(R) "
}

# 10. PULSE — Heartbeat monitor
_build_pulse() {
  echo -n "$(C 32)─$(C 92)╱$(C 32)╲$(C 92)╱$(C 32)─$(R) $(C '1;97')$(_d)$(R)"
  _g && echo -n " $(C 32)─$(C 92)╱$(R) $(C 93)$_GB$(R)" && ((_GD)) && echo -n "$(C 91)!$(R)"
  echo; [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 92)♥$(R) " || echo -n "$(C 91)♥$(R) "
}

# 11. FROST — Icy crystalline
_build_frost() {
  echo -n "$(C 36)❄$(R) $(C '1;97')$(_d)$(R)"
  _g && echo -n " $(C 36)·$(R) $(C '1;96')$_GB$(R)" && ((_GD)) && echo -n "$(C 37)*$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 36)·$(R) $(C 37)$n$(R)"
  echo; echo -n "$(C 36)❯$(R) "
}

# 12. FIRE — Warm flame aesthetic
_build_fire() {
  echo -n "$(C 91)◆$(C 93)◆$(C 33)◆$(R) $(C '1;33')$(_d)$(R)"
  _g && echo -n " $(C 91)◆$(R) $(C '1;93')$_GB$(R)" && ((_GD)) && echo -n " $(C 91)±$_GM$(R)"
  echo; echo -n "$(C 33)$(B)>$(R) "
}

# 13. CIRCUIT — PCB trace paths
_build_circuit() {
  echo -n "$(C 32)┣━$(R) $(C '1;92')$(_d)$(R)"
  _g && echo -n " $(C 32)━┫ $(C 93)$_GB$(R)" && ((_GD)) && echo -n "$(C 91)⚡$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 32)━┫ $(C 96)$n$(R)"
  echo; echo -n "$(C 32)┗━$(R) "
}

# 14. RUNE — Ancient mystical symbols
_build_rune() {
  echo -n "$(C 35)$(B)ᛟ$(R) $(C '1;97')$(_fp)$(R)"
  _g && echo -n " $(C 35)$(B)ᚱ$(R) $(C 95)$_GB$(R)" && ((_GD)) && echo -n "$(C 91)~$(R)"
  echo; echo -n "$(C 35)$(B)ᛉ$(R) "
}

# 15. STARSHIP — Starship-inspired
_build_starship() {
  echo -n "$(C '1;36')$(_fp)$(R)"
  _g && { echo -n " $(C 90)on$(R) $(C 35)$_GB$(R)"; ((_GM+_GS+_GU>0)) && echo -n " $(C 91)[$(_gs | sed "s/$_GB *//")]$(R)"; }
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 90)via$(R) $(C 32)$n$(R)"
  local t=$(_tm); [[ -n "$t" ]] && echo -n " $(C 33)took $t$(R)"
  echo; [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)$(B)❯$(R) " || echo -n "$(C 31)$(B)❯$(R) "
}

# 16. BINARY — Digital stream
_build_binary() {
  echo -n "$(C 32)01$(C 90)10$(R) $(C '1;92')$(_d)$(R)"
  _g && echo -n " $(C 32)│$(R) $(C 93)$_GB$(R)" && ((_GD)) && echo -n " $(C 91)ERR$(R)"
  echo; echo -n "$(C 32)>$(R) "
}

# 17. SPECTRUM — Rainbow gradient
_build_spectrum() {
  echo -n "$(C 91)▪$(C 93)▪$(C 92)▪$(C 96)▪$(C 94)▪$(C 95)▪$(R) $(C '1;97')$(_d)$(R)"
  _g && echo -n " $(C 93)$_GB$(R)" && ((_GD)) && echo -n "$(C 91)*$(R)"
  echo; echo -n "$(C 96)▸$(R) "
}

# 18. BAMBOO — Natural organic
_build_bamboo() {
  echo -n "$(C 32)┃$(R) $(C '1;32')$(_d)$(R)"
  _g && echo -n "$(C 32) ┃ $(C 33)$_GB$(R)" && ((_GD)) && echo -n " $(C 91)~$_GM$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n "$(C 32) ┃ $(C 36)$n$(R)"
  echo; echo -n "$(C 32)┗╸$(R)"
}

# 19. TERMINAL.APP — Classic macOS Terminal look
_build_terminal-app() {
  echo -n "$(C 32)$(_fp) $(C 90)%n$(C 32)\$$(R) "
}

# 20. STACKED — Vertical info blocks
_build_stacked() {
  echo -n "$(C 90)┌──────────────────────$(R)"
  echo; echo -n "$(C 90)│$(R) $(C '1;96')$(_fp)$(R)"
  if _g; then
    echo; echo -n "$(C 90)│$(R) $(C 93)$(_gs)$(R)"
    local n=$(_nd); [[ -n "$n" ]] && echo -n "  $(C 32)$n$(R)"
  fi
  local t=$(_tm); [[ -n "$t" ]] && { echo; echo -n "$(C 90)│$(R) $(C 90)$t$(R)"; }
  [[ "$_sevvi_exit" != "0" ]] && { echo; echo -n "$(C 90)│$(R) $(C 91)exit $_sevvi_exit$(R)"; }
  echo; echo -n "$(C 90)└$(R) $(C 35)$(B)>$(R) "
}

# 21. GHOST — Faded, ethereal
_build_ghost() {
  echo -n "$(C 90)·$(R) $(C 37)$(_d)$(R)"
  _g && echo -n " $(C 90)·$(R) $(C 90)$_GB$(R)" && ((_GD)) && echo -n "$(C 37)*$(R)"
  echo; echo -n "$(C 90)·$(R) "
}

# 22. POWER-ROUND — Rounded powerline capsules
_build_power-round() {
  local _PRB=""
  _prs() {
    local bg=$1 fg=$2 t=$3 bc fc
    (( bg<8 )) && bc=$((40+bg)) || bc=$((100+bg-8))
    (( fg<8 )) && fc=$((30+fg)) || fc=$((90+fg-8))
    if [[ -n "$_PRB" ]]; then local pc; (( _PRB<8 )) && pc=$((30+_PRB)) || pc=$((90+_PRB-8)); echo -n "%{\e[0m\e[${pc}m%}${_RR}%{\e[0m%} "; fi
    echo -n "%{\e[${bc}m\e[${fc}m%} ${t} %{\e[0m%}"; _PRB=$bg
  }
  _PRB=""
  [[ "$_sevvi_exit" != "0" ]] && _prs 1 15 "✗ $_sevvi_exit"
  _prs 4 15 "$(_d)"; _g && { ((_GD)) && _prs 3 0 "$(_gs)" || _prs 2 0 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _prs 6 0 "$n"
  local t=$(_tm); [[ -n "$t" ]] && _prs 8 7 "$t"
  [[ -n "$_PRB" ]] && { local c; (( _PRB<8 )) && c=$((30+_PRB)) || c=$((90+_PRB-8)); echo -n "%{\e[0m\e[${c}m%}${_RR}%{\e[0m%}"; }
  echo; [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 34)$(B)›$(R) " || echo -n "$(C 31)$(B)›$(R) "
}

# 23. POWER-MONO — Powerline but grayscale elegant
_build_power-mono() {
  _pb; _ps 8 15 "$(_d)"
  _g && { ((_GD)) && _ps 7 0 "$(_gs)" || _ps 8 15 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 0 7 "$n"
  _pe; echo; echo -n "$(C 37)$(B)>$(R) "
}

# 24. POWER-NEON — Bright neon powerline segments
_build_power-neon() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "✗"
  _ps 5 15 "$(_d)"; _g && { ((_GD)) && _ps 3 0 "$(_gs)" || _ps 2 0 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "$n"
  local p=$(_py); [[ -n "$p" ]] && _ps 4 15 "$p"
  _pe; echo; echo -n "$(C 95)$(B)❯$(R) "
}

# 25. POWER-GRADIENT — Segments go dark to light
_build_power-gradient() {
  _pb; _ps 0 7 "$(_d)"
  _g && { ((_GD)) && _ps 8 15 "$(_gs)" || _ps 8 15 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 7 0 "$n"
  _pe; echo; echo -n "$(C 90)$(B)>$(R) "
}

# 26. POWER-CYBER — Yellow/red aggressive segments
_build_power-cyber() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "ERR:$_sevvi_exit"
  _ps 3 0 "$(_d)"; _g && { ((_GD)) && _ps 1 15 "$(_gs)" || _ps 2 0 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 3 0 "$n"
  local t=$(_tm); [[ -n "$t" ]] && _ps 0 3 "$t"
  _pe; echo; echo -n "$(C 33)$(B)>>$(R) "
}

# 27. POWER-OCEAN — Blue/cyan oceanic powerline
_build_power-ocean() {
  _pb; _ps 4 15 "$(_d)"
  _g && { ((_GD)) && _ps 6 0 "$(_gs)" || _ps 6 0 "$_GB ok"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 4 15 "$n"
  _pe; echo; echo -n "$(C 36)$(B)~>$(R) "
}

# 28. POWER-FOREST — Green/brown natural powerline
_build_power-forest() {
  _pb; _ps 2 0 "$(_d)"
  _g && { ((_GD)) && _ps 3 0 "$(_gs)" || _ps 2 0 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 2 15 "$n"
  local p=$(_py); [[ -n "$p" ]] && _ps 8 2 "$p"
  _pe; echo; echo -n "$(C 32)$(B)>$(R) "
}

# 29. POWER-SPLIT — Two-line powerline, info top, arrow bottom
_build_power-split() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "✗ $_sevvi_exit"
  _ps 5 15 "$(_d)"
  _g && { ((_GD)) && _ps 3 0 "$(_gs)" || _ps 2 0 "$_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "$n"
  local p=$(_py); [[ -n "$p" ]] && _ps 4 15 "$p"
  local t=$(_tm); [[ -n "$t" ]] && _ps 8 7 "⏱ $t"
  _pe; echo
  echo -n "$(C 90)╰─$(R)$(C 35)$(B)❯$(R) "
}

# 30. POWER-MINIMAL — Single segment powerline
_build_power-minimal() {
  _pb; _ps 5 15 "$(_d)"
  _g && ((_GD)) && _ps 3 0 "$_GB*"
  _pe; echo; echo -n "$(C 35)$(B)>$(R) "
}

# 31. POWER-BLOCKS — Flat colored blocks with spaces
_build_power-blocks() {
  local o=""
  o+="%{\e[45m\e[97m%} $(_d) %{\e[0m%}"
  _g && { ((_GD)) && o+=" %{\e[43m\e[30m%} $(_gs) %{\e[0m%}" || o+=" %{\e[42m\e[30m%} $_GB %{\e[0m%}"; }
  local n=$(_nd); [[ -n "$n" ]] && o+=" %{\e[46m\e[30m%} $n %{\e[0m%}"
  local p=$(_py); [[ -n "$p" ]] && o+=" %{\e[44m\e[97m%} $p %{\e[0m%}"
  local t=$(_tm); [[ -n "$t" ]] && o+=" %{\e[100m\e[37m%} $t %{\e[0m%}"
  echo -n "$o"; echo; echo -n "$(C 35)$(B)>$(R) "
}

# 32. P10K-RAINBOW — Classic p10k rainbow: colored bg segments, diamond separators
_build_p10k-rainbow() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "✘"
  _ps 4 15 "$(_d)"
  _g && { ((_GD)) && _ps 3 0 " $(_gs)" || _ps 2 0 " $_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 2 0 " $n"
  local p=$(_py); [[ -n "$p" ]] && _ps 4 15 " $p"
  local t=$(_tm); [[ -n "$t" ]] && _ps 8 7 " $t"
  _pe
  echo; [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 34)$(B)❯$(R) " || echo -n "$(C 31)$(B)❯$(R) "
}

# 33. P10K-LEAN — No bg colors, clean colored text, two-line
_build_p10k-lean() {
  echo -n "$(C 34)$(_fp)$(R)"
  _g && echo -n " $(C 36)$_GB$(R)" && ((_GD)) && echo -n " $(C 33)✎$_GM$(R)" && ((_GS>0)) && echo -n "$(C 32)+$_GS$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 32)$n$(R)"
  local t=$(_tm); [[ -n "$t" ]] && echo -n " $(C 33)$t$(R)"
  [[ "$_sevvi_exit" != "0" ]] && echo -n " $(C 31)✘$(R)"
  echo; [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)❯$(R) " || echo -n "$(C 31)❯$(R) "
}

# 34. P10K-CLASSIC — bg segments with angled separators + frame lines
_build_p10k-classic() {
  echo -n "$(C 90)╭─$(R)"
  _pb
  _ps 4 15 " $(_d)"
  _g && { ((_GD)) && _ps 3 0 " $(_gs)" || _ps 2 0 " $_GB ✓"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "⬢ $n"
  _pe
  echo; echo -n "$(C 90)╰─$(R)"
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 34)$(B)❯$(R) " || echo -n "$(C 31)$(B)❯$(R) "
}

# 35. P10K-PURE — Async git, floating prompt, minimal like Pure theme
_build_p10k-pure() {
  echo -n "$(C 34)$(_fp)$(R)"
  _g && echo -n " $(C 90)$_GB$(R)" && ((_GD)) && echo -n "$(C 36)*$(R)"
  local t=$(_tm); [[ -n "$t" ]] && echo -n " $(C 33)$t$(R)"
  echo
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)❯$(R) " || echo -n "$(C 31)❯$(R) "
}

# 36. P10K-LEAN8 — Lean but with only 8 basic colors, retro feel
_build_p10k-lean8() {
  echo -n "$(C 34)$(_d)$(R)"
  _g && echo -n " $(C 36)$_GB$(R)" && ((_GD)) && echo -n "$(C 31)!$(R)"
  local n=$(_nd); [[ -n "$n" ]] && echo -n " $(C 32)$n$(R)"
  echo; echo -n "$(C 32)%#$(R) "
}

# 37. P10K-ROBBYRUSSELL — oh-my-zsh default look emulation
_build_p10k-robbyrussell() {
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 32)$(B)➜$(R) " || echo -n "$(C 31)$(B)➜$(R) "
  echo -n "$(C 36)$(_d)$(R)"
  _g && echo -n " $(C 34)($(C 31)$_GB$(C 34))$(R)" && ((_GD)) && echo -n " $(C 33)✗$(R)"
  echo -n " "
}

# 38. P10K-EXTRAVAGANT — Maximum info, everything visible, dense
_build_p10k-extravagant() {
  _pb
  [[ "$_sevvi_exit" != "0" ]] && _ps 1 15 "✘ $_sevvi_exit"
  _ps 5 15 " $(_d)"
  _g && { ((_GD)) && _ps 3 0 " $(_gs)" || _ps 2 0 " $_GB ✓"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "⬢ $n"
  local p=$(_py); [[ -n "$p" ]] && _ps 4 15 " $p"
  local t=$(_tm); [[ -n "$t" ]] && _ps 8 7 "⏱ $t"
  _pe
  echo; echo -n "$(C 90)at $(C 37)$(date +%H:%M)$(R) $(C 35)$(B)❯$(R) "
}

# 39. P10K-SPARTAN — Absolute minimum like p10k spartan mode
_build_p10k-spartan() {
  echo -n "$(C 37)$(print -P '%1~')$(R) "
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)%#$(R) " || echo -n "$(C 31)%#$(R) "
}

# 40. P10K-TRANSIENT — Full top line, but input line is minimal (simulates transient prompt)
_build_p10k-transient() {
  _pb; _ps 4 15 " $(_fp)"
  _g && { ((_GD)) && _ps 3 0 " $(_gs)" || _ps 2 0 " $_GB"; }
  local n=$(_nd); [[ -n "$n" ]] && _ps 6 0 "⬢ $n"
  local p=$(_py); [[ -n "$p" ]] && _ps 4 15 " $p"
  _pe
  echo; echo -n "$(C 35)❯$(R) "
}

# 41. P10K-TWO-LINE-FRAME — Full framed two-line with left+right info
_build_p10k-two-line-frame() {
  # Top line
  echo -n "$(C 90)╭─$(R)"
  _pb; _ps 4 15 " $(_d)"
  _g && { ((_GD)) && _ps 3 0 " $(_gs)" || _ps 2 0 " $_GB ✓"; }
  _pe
  # Right-aligned info (simulated)
  local rinfo=""
  local n=$(_nd); [[ -n "$n" ]] && rinfo+=" $(C 32)⬢ $n$(R)"
  local p=$(_py); [[ -n "$p" ]] && rinfo+=" $(C 34) $p$(R)"
  local t=$(_tm); [[ -n "$t" ]] && rinfo+=" $(C 33)⏱$t$(R)"
  [[ -n "$rinfo" ]] && echo -n " $rinfo"
  # Bottom line
  echo; echo -n "$(C 90)╰─$(R)"
  [[ "$_sevvi_exit" == "0" ]] && echo -n "$(C 35)$(B)❯$(R) " || echo -n "$(C 31)$(B)❯$(R) "
}

# ══════════════════════════════════════════════
_sevvi_build_prompt() {
  _g 2>/dev/null
  case "${SEVVI_PROMPT_STYLE:-powerline}" in
    powerline)      _build_powerline ;;
    glitch)         _build_glitch ;;
    typewriter)     _build_typewriter ;;
    radar)          _build_radar ;;
    wave)           _build_wave ;;
    pixel)          _build_pixel ;;
    noir)           _build_noir ;;
    tokyo)          _build_tokyo ;;
    dna)            _build_dna ;;
    pulse)          _build_pulse ;;
    frost)          _build_frost ;;
    fire)           _build_fire ;;
    circuit)        _build_circuit ;;
    rune)           _build_rune ;;
    starship)       _build_starship ;;
    binary)         _build_binary ;;
    spectrum)       _build_spectrum ;;
    bamboo)         _build_bamboo ;;
    terminal-app)   _build_terminal-app ;;
    stacked)        _build_stacked ;;
    ghost)          _build_ghost ;;
    power-round)    _build_power-round ;;
    power-mono)     _build_power-mono ;;
    power-neon)     _build_power-neon ;;
    power-gradient) _build_power-gradient ;;
    power-cyber)    _build_power-cyber ;;
    power-ocean)    _build_power-ocean ;;
    power-forest)   _build_power-forest ;;
    power-split)    _build_power-split ;;
    power-minimal)  _build_power-minimal ;;
    power-blocks)   _build_power-blocks ;;
    p10k-rainbow)   _build_p10k-rainbow ;;
    p10k-lean)      _build_p10k-lean ;;
    p10k-classic)   _build_p10k-classic ;;
    p10k-pure)      _build_p10k-pure ;;
    p10k-lean8)     _build_p10k-lean8 ;;
    p10k-robbyrussell) _build_p10k-robbyrussell ;;
    p10k-extravagant)  _build_p10k-extravagant ;;
    p10k-spartan)   _build_p10k-spartan ;;
    p10k-transient) _build_p10k-transient ;;
    p10k-two-line-frame) _build_p10k-two-line-frame ;;
    *)              _build_powerline ;;
  esac
}

_sevvi_preexec() { _sevvi_cmd_start=$EPOCHSECONDS; }
_sevvi_precmd() { _sevvi_exit=$?; PROMPT="$(_sevvi_build_prompt)"; RPROMPT=""; }
autoload -Uz add-zsh-hook
add-zsh-hook preexec _sevvi_preexec
add-zsh-hook precmd _sevvi_precmd
_sevvi_exit=0; PROMPT="$(_sevvi_build_prompt)"; RPROMPT=""
