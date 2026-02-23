import { defineStore } from "pinia";
import { ref } from "vue";

export const useHeaderTitleStore = defineStore("header-title", () => {
  const title = ref("");
  const desc = ref("");

  function setTitle(newTitle, newDecs) {
    if (newTitle != "" && newTitle != " " && newTitle != null)
      title.value = newTitle;
    if (newDecs != "" && newDecs != " " && newDecs != null)
      desc.value = newDecs;
  }

  return { title, desc, setTitle };
});
