# Submasters-Vera
A plugin for Vera Home Automation Controllers to implement submasters for dimming/scene control.

Don't know what submasters are? Well, in its basic form, it's a dimmer that controls other dimmers. So, for example, you can have a room full of lights, each with its own dimmer, controlled by a separate dimmer (which can be a real dimmer or a virtual device).

The term "submasters" comes from the stage lighting world, where this structure of coordinating lights is very common. Here's one of the videos that served as an inspiration for this plugin: https://www.youtube.com/watch?v=d4qptPxR9xI

The key that makes submasters really useful is that each controlled light can be assigned a different maximum level, and the actual level set for the light is between 0% and the maximum level in proportion to the 0-100% range of the controlling dimmer (the "fader"). So if two devices are assigned maximum levels of 80% and 50%, then when the controlling fader is at 100%, the devices will be at those 80% and 50% levels, respectively. But when the controlling fader is lowered to 50%, the controlled lights will be set to 40% (50% of 80%) and 25% (50% of 50%), respectively.

## Installing

Right now, this plugin is still in development and has not been released to the Vera Plugin Marketplace or AltAppStore. To install:

1. Click the green "Clone or download" button on the Github repository: https://github.com/toggledbits/Submasters-Vera/tree/master
2. Save the ZIP file and unzip its contents.
3. Open the Vera upload tool at *Apps > Develop apps > Luup files*
3. Select all of the unzipped files except README.md and CHANGELOG.md and drag them to the "Upload" area (drag them all together as a group).
4. After the upload and reload of Luup complete, go to *Apps > Develop apps > Create device* and copy-paste the following into the named fields. Leave the remaining fields blank. Then click the "Create device" button. 
   * Description: `Submasters`
   * UPnP Device Filename: `D_Submasters1.xml`
   * UPnP Implementation Filename: `I_Submasters1.xml`
6. Wait a moment, then reload Luup by going to *Apps > Develop apps > Test Luup code*, entering and running: `luup.reload()`
7. As Luup reloads, do a [hard refresh of your browser](). This is a vital step!

## Configuring Submasters

TBD--more coming soon.

Skeleton version:

1. Click in the submaster name field to change the name.
2. Select the submaster fader (the dimmer that controls other devices) from the "Fader" dropdown list.
3. To add a controlled device, click on the blue header of an unassigned channel. It will blink red, indicating assignment mode. Choose the device from the device list at the bottom of the page, and click "Assign Device". Repeat this until all devices are assigned to the submaster.
4. To program the level for a device, click on the white bottom half of the channel button. It will turn green to indicate it has been selected. Raise/lower the dimmer to the maximum value for that device (the level it will get when the fader is at 100%). When done, click the green base/level to deselect the device and set the level.
5. When no devices are in assignment mode (blinking red) or programming mode (green base), the fader control will control the fader device, which in turn will control its controlled devices.
6. Watch the messages rolling in the status area for hints about how things work.

## Questions, Issues, Suggestions

Please post any questions, issues, or suggestions to @rigpapa in the Vera Community Forums.
