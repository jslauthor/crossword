import { Avatar, AvatarFallback, AvatarImage } from 'components/core/ui/avatar';
import React, { useMemo } from 'react';
import { styled } from 'styled-components';

const UserInfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: left;
  margin-left: 0.5rem;
`;

interface UserInfoProps {
  name: string;
  email: string;
  src?: string;
  className?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ name, email, src, className }) => {
  const avatarName = useMemo(() => {
    if (name.length < 1) return '';
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName =
      nameParts.length === 1 ? '' : nameParts[nameParts.length - 1];
    return `${firstName[0]}${lastName[0]}`;
  }, [name]);

  return (
    <UserInfoContainer className={className}>
      <Avatar>
        <AvatarImage src={src} alt={avatarName} />
        <AvatarFallback>{avatarName}</AvatarFallback>
      </Avatar>
      <InfoContainer>
        <p className="font-bold leading-none">{name}</p>
        <p>{email}</p>
      </InfoContainer>
    </UserInfoContainer>
  );
};

export default UserInfo;
