import { useState } from "react";

import {
  validateRssUrl,
  validateName,
  validateEmail,
  validateBlogger,
} from "@/components/RssRegistration/RssValidation";

import { PLATFORMS, PlatformType } from "@/constants/rss";

import { trackEvent } from "@/utils/analytics";

import { useRegisterModalStore } from "@/store/useRegisterModalStore";

export const useRssRegistrationForm = () => {
  const [platform, setPlatform] = useState<PlatformType>("tistory");
  const store = useRegisterModalStore();

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform as PlatformType);
    store.handleInputChange("", store.setRssUrl, store.setRssUrlValid, validateRssUrl);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    const { prefix, suffix } = PLATFORMS[platform];
    const fullUrl = `${prefix}${username}${suffix}`;
    store.handleInputChange(fullUrl, store.setRssUrl, store.setRssUrlValid, validateRssUrl);
  };

  const getUsernameFromUrl = () => {
    const { prefix, suffix } = PLATFORMS[platform];
    return (store.rssUrl || "").replace(prefix, "").replace(suffix, "");
  };

  const handleFormSubmit = () => {
    if (store.isFormValid()) {
      trackEvent("rss_registration", {
        event_category: "forms",
        event_label: "rss_submit",
        platform: platform,
        blog_platform: platform,
      });
    }
  };

  return {
    platform,
    values: {
      rssUrl: store.rssUrl,
      bloggerName: store.bloggerName,
      userName: store.userName,
      email: store.email,
      urlUsername: getUsernameFromUrl(),
    },
    handlers: {
      handlePlatformChange,
      handleUsernameChange,
      handleBloggerName: (value: string) =>
        store.handleInputChange(value, store.setBloggerName, store.setBloggerNameValid, validateBlogger),
      handleUserName: (value: string) =>
        store.handleInputChange(value, store.setUserName, store.setUserNameValid, validateName),
      handleEmail: (value: string) =>
        store.handleInputChange(value, store.setEmail, store.setEmailValid, validateEmail),
    },
    formState: {
      isValid: store.isFormValid(),
      reset: store.resetInputs,
      handleSubmit: handleFormSubmit,
    },
  };
};
