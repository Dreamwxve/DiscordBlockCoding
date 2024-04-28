import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import { Backpack } from "@blockly/workspace-backpack";
import { WorkspaceSearch } from "@blockly/plugin-workspace-search";
import { ZoomToFitControl } from "@blockly/zoom-to-fit";
import "@blockly/toolbox-search";
import * as SuggestedBlocks from "@blockly/suggested-blocks";

import "./functions/registerContextMenus";
import { toolbox } from "./toolbox";
import { DFTheme } from "./DFTheme";

import "./blocks/main";
import "./blocks/messages";
import "./blocks/slash";
import "./blocks/servers";
import "./blocks/games";
import "./blocks/events/joins";

export default function Workspace() {
  useEffect(() => {
    // Inject workspace
    const workspace = Blockly.inject(document.getElementById("workspace"), {
      toolbox,
      theme: DFTheme,
      move: {
        wheel: true,
      },
      renderer: "zelos",
      collapse: true,
      comments: true,
      disable: true,
      maxBlocks: Infinity,
      trashcan: true,
      horizontalLayout: false,
      toolboxPosition: "start",
      css: true,
      media: "https://blockly-demo.appspot.com/static/media/",
      rtl: false,
      scrollbars: true,
      sounds: true,
      oneBasedIndex: true,
      grid: {
        spacing: 20,
        length: 1,
        colour: "#888",
        snap: false,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
    });

    // Initiating plugins
    const backpack = new Backpack(workspace, {
      allowEmptyBackpackOpen: false,
      contextMenu: {
        copyAllToBackpack: true,
        pasteAllToBackpack: true,
      },
    });
    backpack.init();

    const workspaceSearch = new WorkspaceSearch(workspace);
    workspaceSearch.init();

    const zoomToFit = new ZoomToFitControl(workspace);
    zoomToFit.init();

    SuggestedBlocks.init(workspace);

    // Disable orphans
    workspace.addChangeListener(Blockly.Events.disableOrphans);

    workspace.addChangeListener((event) => {
      // Autosave
      let save = Blockly.serialization.workspaces.save(workspace);
      if (save.blocks) {
        localStorage.setItem("dfWorkspaceAutosave", JSON.stringify(save));
      }

      const codeEle = document.getElementById("code");

      let js = `const Discord = require("discord.js");
      const moment = require("moment");
      const gamecord = require("discord-gamecord");
      const client = new Discord.Client({ intents: 3276799 });

      client.setMaxListeners(0);

      client.on("ready", () => {
      console.log(client.user.username + " is logged in");
      });

      ${javascriptGenerator.workspaceToCode(workspace)}
      `;

      codeEle.innerText = js;
    });

    // Save file event
    document.querySelector(".navbar .left #save").onclick = async () => {
      const data = JSON.stringify(
        Blockly.serialization.workspaces.save(workspace)
      );
      const blob = new Blob([data], { type: "application/json" });

      const fileHandle = await window.showSaveFilePicker({
        suggestedName:
          document.querySelector(".navbar #projectName").value ||
          "DisFuse Project",
        types: [
          {
            description: "DisFuse Save File",
            accept: { "application/json": [".df"] },
          },
        ],
      });
      const fileStream = await fileHandle.createWritable();

      await fileStream.write(blob);
      await fileStream.close();

      Swal.fire({
        toast: true,
        position: "bottom-end",
        timer: 5000,
        timerProgressBar: true,
        icon: "success",
        title: "Successfully saved",
        showConfirmButton: false,
      });
    };

    // Load file event
    document.querySelector(".navbar .left #load").onclick = async () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".df";

      fileInput.addEventListener("change", (e) => {
        let file = e.target.files[0];
        if (!file) return;

        let reader = new FileReader();

        reader.onload = (event) => {
          let data = event.target.result;

          workspace.clear();
          Blockly.serialization.workspaces.load(JSON.parse(data), workspace);

          Swal.fire({
            toast: true,
            position: "bottom-end",
            timer: 5000,
            timerProgressBar: true,
            icon: "success",
            title: "Successfully loaded",
            showConfirmButton: false,
          });
        };

        reader.readAsText(file);
      });

      fileInput.click();
      fileInput.remove();
    };

    // Recover file event
    document.querySelector(".navbar .left #recover").onclick = async () => {
      Swal.fire({
        title: "Recover Project",
        html: '<p class="modal-text">DisFuse autosaves your workspace to your device\'s local storage, in case you forget to save your project. We can try to recover your last used workspace if one exists.</p>',
        icon: "warning",
        confirmButtonText: "Recover",
        showCancelButton: true,
      }).then((result) => {
        if (!result.isConfirmed) return;

        let data = localStorage.getItem("dfWorkspaceAutosave");
        if (!data)
          return Swal.fire({
            icon: "error",
            title: "Save not found",
            text: "We couldn't find an autosave in your local storage. Remember to save your file next time!",
            confirmButtonText: "Ok",
          });

        workspace.clear();
        Blockly.serialization.workspaces.load(JSON.parse(data), workspace);

        Swal.fire({
          toast: true,
          position: "bottom-end",
          timer: 5000,
          timerProgressBar: true,
          icon: "success",
          title: "Successfully recovered",
          showConfirmButton: false,
        });
      });
    };
  }, []);
  return <div id="workspace"></div>;
}
