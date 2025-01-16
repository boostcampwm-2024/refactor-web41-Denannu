import { useEffect, useState } from "react";

import FormInput from "@/components/RssRegistration/FormInput";
import { PlatformSelector } from "@/components/RssRegistration/PlatformSelector";
import { RssUrlInput } from "@/components/RssRegistration/RssUrlInput";
import Alert from "@/components/common/Alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useRssRegistrationForm } from "@/hooks/common/useRssRegistrationForm";
import { useRegisterRss } from "@/hooks/queries/useRegisterRss";

import { useRegisterModalStore } from "@/store/useRegisterModalStore";
import { AlertType } from "@/types/alert";
import { RegisterRss } from "@/types/rss";

export default function RssRegistrationModal({ onClose, rssOpen }: { onClose: () => void; rssOpen: boolean }) {
  const [alertOpen, setAlertOpen] = useState<AlertType>({ title: "", content: "", isOpen: false });
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");

  const { platform, values, handlers, formState } = useRssRegistrationForm();
  const { mutate } = useRegisterRss(
    () => {
      setAlertOpen({
        title: "RSS 요청 성공!",
        content: "관리자가 검토 후 처리 결과를 입력해주신 메일을 통해 전달드릴 예정이에요!",
        isOpen: true,
      });
    },
    () => {
      setAlertOpen({
        title: "RSS 요청 실패!",
        content: "입력한 정보를 확인하거나 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요!",
        isOpen: true,
      });
    }
  );

  useEffect(() => {
    if (rssOpen) {
      const store = useRegisterModalStore.getState();
      const hasPreviousData =
        store.bloggerName.trim() !== "" || store.userName.trim() !== "" || store.email.trim() !== "";
      if (hasPreviousData) {
        setMessageText("등록 중이던 데이터를 불러왔습니다.");
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }

      store.setRssUrlValid(/^(https?:\/\/[^\s]+)$/i.test(store.rssUrl));
      store.setBloggerNameValid(store.bloggerName.trim().length > 0);
      store.setUserNameValid(store.userName.trim().length > 0);
      store.setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.email));
    }
  }, [rssOpen]);

  const handleAlertClose = () => {
    setAlertOpen({ title: "", content: "", isOpen: false });
    formState.reset();
    onClose();
  };

  const handleRegister = () => {
    const data: RegisterRss = {
      rssUrl: values.rssUrl,
      blog: values.bloggerName,
      name: values.userName,
      email: values.email,
    };
    mutate(data);
  };

  return (
    <Dialog open={rssOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">RSS 등록</DialogTitle>
          <DialogDescription className="flex flex-col text-muted-foreground">
            <span>RSS 주소 검토 후 운영진이 서비스에 추가합니다.</span>
            <span>검토 및 등록에는 영업일 기준 3-5일이 소요될 수 있습니다.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <PlatformSelector platform={platform} onPlatformChange={handlers.handlePlatformChange} />
          <RssUrlInput platform={platform} value={values.urlUsername} onChange={handlers.handleUsernameChange} />
          {showMessage && <div className="mb-4 text-sm text-primary font-medium">{messageText}</div>}

          <div className="space-y-4">
            <FormInput
              id="blog"
              label="블로그명"
              onChange={handlers.handleBloggerName}
              placeholder="블로그명을 입력하세요"
              value={values.bloggerName}
            />
            <FormInput
              id="name"
              label="신청자 이름"
              onChange={handlers.handleUserName}
              placeholder="이름을 입력하세요"
              value={values.userName}
            />
            <FormInput
              id="email"
              label="이메일"
              onChange={handlers.handleEmail}
              placeholder="example@denamu.com"
              value={values.email}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleRegister}
            disabled={!formState.isValid}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
      <Alert alertOpen={alertOpen} onClose={handleAlertClose} />
    </Dialog>
  );
}
