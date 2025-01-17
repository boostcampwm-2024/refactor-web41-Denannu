import { create } from "zustand";

import { persist } from "zustand/middleware";

interface RegisterModalState {
  rssUrl: string;
  bloggerName: string;
  userName: string;
  email: string;

  rssUrlValid: boolean;
  bloggerNameValid: boolean;
  userNameValid: boolean;
  emailValid: boolean;

  setRssUrl: (url: string) => void;
  setBloggerName: (name: string) => void;
  setUserName: (name: string) => void;
  setEmail: (email: string) => void;

  setRssUrlValid: (valid: boolean) => void;
  setBloggerNameValid: (valid: boolean) => void;
  setUserNameValid: (valid: boolean) => void;
  setEmailValid: (valid: boolean) => void;

  handleInputChange: (
    value: string,
    setValue: (value: string) => void,
    setValid: (valid: boolean) => void,
    validate: (value: string) => boolean
  ) => void;

  resetInputs: () => void;
  isFormValid: () => boolean;
}

export const useRegisterModalStore = create(
  persist<RegisterModalState>(
    (set, get) => ({
      rssUrl: "",
      bloggerName: "",
      userName: "",
      email: "",

      rssUrlValid: false,
      bloggerNameValid: false,
      userNameValid: false,
      emailValid: false,

      setRssUrl: (url) => set({ rssUrl: url }),
      setBloggerName: (name) => set({ bloggerName: name }),
      setUserName: (name) => set({ userName: name }),
      setEmail: (email) => set({ email }),

      setRssUrlValid: (valid) => set({ rssUrlValid: valid }),
      setBloggerNameValid: (valid) => set({ bloggerNameValid: valid }),
      setUserNameValid: (valid) => set({ userNameValid: valid }),
      setEmailValid: (valid) => set({ emailValid: valid }),

      resetInputs: () =>
        set({
          rssUrl: "",
          bloggerName: "",
          userName: "",
          email: "",
          rssUrlValid: false,
          bloggerNameValid: false,
          userNameValid: false,
          emailValid: false,
        }),

      isFormValid: () => {
        const state = get();
        return state.rssUrlValid && state.bloggerNameValid && state.userNameValid && state.emailValid;
      },

      handleInputChange: (value, setValue, setValid, validate) => {
        setValue(value);
        setValid(validate(value));
      },
    }),
    {
      name: "register-modal-storage",
      partialize: (state) => ({
        bloggerName: state.bloggerName,
        userName: state.userName,
        email: state.email,
      }),
    }
  )
);
