---
name: slipway-vm
description: Launches, screenshots and clicks through Mac app builds inside a headless macOS test VM with the slipway command, so testing never takes over the user's screen. Use it every time you're about to open, relaunch, screenshot, click or UI-test a Mac app you built (Xcode, SwiftPM or Electron), instead of running `open` on this Mac. Also use it when the user mentions the test VM or slipway, or says agents keep taking over their screen.
---

# Testing Mac apps in the test VM

The user keeps working on this Mac while you build their apps. When you open an app here, it steals the focus and interrupts them. So every launch, screenshot and click happens in a macOS virtual machine, through the `slipway` command.

The VM is called `slipway` and runs under [Tart](https://tart.run), with no window and its own screen. Nothing shows up on the user's screen.

## Rules

- Never run `open` on an app you built, and never quit or relaunch the user's copy. Use `slipway open`.
- Build on this Mac as usual. Only the finished `.app` goes to the VM.
- XCUITest UI tests take over the screen too. Drive the app in the VM instead.
- When you're done, tell the user where the build is, so they can open it themselves.

If `slipway` isn't installed, point the user to <https://github.com/smeltery/slipway>.

## Workflow

Start with a note that says what you're about to test. It goes in the log, and Porthole shows it next to your chat:

```bash
slipway note 'Checking the new Sort by usage menu in Skillscout'
```

Then build, and open the build in the VM. `slipway` starts the VM when it's not running, which takes about 15 seconds.

```bash
xcodebuild -project Skillscout.xcodeproj -scheme Skillscout -configuration Debug -derivedDataPath build build
slipway open build/Build/Products/Debug/Skillscout.app
```

`slipway open` copies the app to `~/Apps` in the VM, quits the old copy, launches the new one and waits for a window. Launch arguments go after the path. For a SwiftPM app, open the `.app` its bundle script produces, not the bare executable.

Take a screenshot of the app's window:

```bash
slipway shot Skillscout
```

It prints the path of a PNG in `/tmp/slipway`, which you can look at. Leave out the name to capture the whole VM screen, for menu bar apps, menus and alerts outside the window.

To see what's in the window without guessing from pixels, list its controls. Each one comes with its text and the point to click:

```bash
slipway ui Skillscout
```

```text
WINDOW "Skillscout"
AXStaticText "Missing somewhere"  center 255,200
AXPopUpButton [pop up button] = Newest first  center 855,113
AXButton "Find repeated tasks" (disabled)  center 976,113
AXTextField [search text field] = release  center 1171,114
```

A name in quotes is the control's label. Square brackets mean it has no label, so you get its type instead. Coordinates are screen points, the same ones `click` takes. Then interact with it:

```bash
slipway click 255 200
slipway click 1171 114
slipway type 'release'
slipway key cmd+a
slipway key return
```

`key` takes `cmd`, `shift`, `option` and `ctrl` with one character, or a named key: `return`, `esc`, `tab`, `space`, `delete`, `up`, `down`, `left`, `right`.

Menus, and anything else System Events can do, go through AppleScript on stdin:

```bash
slipway script <<'EOF'
tell application "System Events" to tell process "Skillscout"
  click menu item "Settings…" of menu "Skillscout" of menu bar 1
end tell
EOF
```

`slipway logs Skillscout` prints what the app wrote to stdout and stderr since launch, so `print()` debugging works. `slipway quit Skillscout` quits it. Run `slipway help` for the full list, or `slipway capabilities` for the agent manifest.

## Other agents

Other agents can be in the VM at the same time as you. Their clicks and keys go to whatever app is in front, just like yours, so a screenshot can show another agent's app. Bring your app to the front with `slipway shot <Name>` before you click. When you move on to testing something else, add another `slipway note`.

## Data and settings

The VM is a clean Mac with one user, `admin`. It has none of the user's files, so an app that reads their data starts empty. Copy in what the test needs, usually a small sample:

```bash
slipway push ~/Documents/sample-notes/ Documents/sample-notes/
slipway run 'defaults write com.flaviocopes.skillscout sortSkillsByUse -bool true'
```

Paths on the VM side are relative to its home folder. Never copy secrets, tokens or keychains into the VM.

The VM has no Apple ID, so iCloud, Sign in with Apple and similar features don't work there. Ask the user before testing those on this Mac.

## When the VM misbehaves

- `slipway status` says whether it's running. `slipway stop` then `slipway start` restarts it. The boot log is `~/Library/Logs/slipway.log`.
- If a prompt about `com.apple.sshd-session` bypassing the private window picker covers the screen, approve it with `slipway script <<< 'tell application "System Events" to click button "Allow" of window 1 of process "UserNotificationCenter"'`.
- `slipway ssh` opens a shell in the VM. The `admin` password is `admin`, `sudo` needs no password, and Homebrew is installed.
- If screenshots come back black or clicks do nothing after a macOS update in the VM, the permission grants are gone. Recreating the VM fixes it: `tart delete slipway` then `slipway setup`. Setup downloads about 25 GB if Tart doesn't have the image cached, so ask the user first.

`slipway` can also drive a real Mac, like a Mac mini, when `TEST_HOST` is set in `~/.config/slipway/config`. Every command works the same way.
