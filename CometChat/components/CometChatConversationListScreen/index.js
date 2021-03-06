import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../util/enums.js';
import Translator from "../../resources/localization/translator";

import CometChatConversationList from "../CometChatConversationList";
import CometChatMessageListScreen from "../CometChatMessageListScreen";
import CometChatUserDetail from "../CometChatUserDetail";
import CometChatGroupDetail from "../CometChatGroupDetail";
import MessageThread from "../MessageThread";
import CometChatIncomingCall from "../CometChatIncomingCall";
import ImageView from "../ImageView";

import { theme } from "../../resources/theme";

import {
  chatScreenStyle,
  chatScreenSidebarStyle,
  chatScreenMainStyle,
  chatScreenSecondaryStyle
} from "./style";


class CometChatConversationListScreen extends React.Component {

  loggedInUser = null;

  constructor(props) {
		super(props);

    this.state = {
      darktheme: false,
      viewdetailscreen: false,
      item: {},
      type: "",
      tab: "conversations",
      groupToDelete: {},
      groupToLeave: {},
      groupToUpdate: {},
      threadmessageview: false,
      threadmessagetype: null,
      threadmessageitem: {},
      threadmessageparent: {},
      composedthreadmessage: {},
      incomingCall: null,
      messageToMarkRead: {},
      sidebarview: false,
      imageView: null,
      groupmessage: {},
      lastmessage: {},
      lang: props.lang,
      unreadMessages: []
    }

    this.messageScreenRef = React.createRef();

    CometChat.getLoggedInUser().then((user) => {
      this.loggedInUser = user;
    }).catch((error) => {
      console.log("[CometChatUnified] getLoggedInUser error", error);
    });
  }
  
  componentDidMount() {

    if(!Object.keys(this.state.item).length) {
      this.toggleSideBar();
    }
  }

  componentDidUpdate(prevProps) {

    if (prevProps.lang !== this.props.lang) {
      this.setState({ lang: this.props.lang });
    }
  }

  changeTheme = (e) => {

    const theme = this.state.darktheme;
    this.setState({darktheme: !theme})
  }

  itemClicked = (item, type) => {

    this.toggleSideBar();
    this.setState({ item: {...item}, type, viewdetailscreen: false })
  }

  actionHandler = (action, item, count, ...otherProps) => {
    
    switch(action) {
      case "blockUser":
        this.blockUser();
      break;
      case "unblockUser":
        this.unblockUser();
      break;
      case "viewDetail":
      case "closeDetailClicked":
        this.toggleDetailView();
      break;
      // eslint-disable-next-line no-lone-blocks
      case "menuClicked":{
        this.toggleSideBar();
        this.setState({ item: {} });
      }
        break;
      case "closeMenuClicked":
        this.toggleSideBar();
      break;
      case "groupUpdated":
        this.groupUpdated(item, count, ...otherProps);
      break;
      case "groupDeleted": 
        this.deleteGroup(item);
      break;
      case "leftGroup":
        this.leaveGroup(item, ...otherProps);
      break;
      case "membersUpdated":
        this.updateMembersCount(item, count);
      break;
      case "viewMessageThread":
        this.viewMessageThread(item);
      break;
      case "closeThreadClicked":
        this.closeThreadMessages();
      break;
      case "threadMessageComposed":
        this.onThreadMessageComposed(item);
        this.updateLastMessage(item[0]);
      break;
      case "acceptedIncomingCall":
        this.acceptedIncomingCall(item);
        break;
      case "rejectedIncomingCall":
        this.rejectedIncomingCall(item, count);
        break;
      case "messageToMarkRead":
        this.setState({ messageToMarkRead: item });
        break;
      case "viewActualImage":
        this.toggleImageView(item);
        break;
      case "membersAdded":
        this.membersAdded(item);
        break;
      case "memberUnbanned":
        this.memberUnbanned(item);
        break;
      case "memberScopeChanged":
        this.memberScopeChanged(item);
        break;
      case "messageComposed":
      case "messageEdited":
      case "messageDeleted":
        this.updateLastMessage(item[0]);
        break;
      case "updateThreadMessage":
        this.updateThreadMessage(item[0], count);
        break;
      case "unreadMessages":
        this.setState({ unreadMessages: [...item] });
        break;
      default:
      break;
    }
  }

  updateLastMessage = (message) => {
    this.setState({ lastmessage: message });
  }

  updateThreadMessage = (message, action) => {

    if (this.state.threadmessageview === false || message.id !== this.state.threadmessageparent.id) {
      return false;
    }

    if (action === "delete") {
      this.setState({ threadmessageparent: { ...message }, threadmessageview: false });
    } else {
      this.setState({ threadmessageparent: { ...message } });
    }

  }

  blockUser = () => {

    let usersList = [this.state.item.uid];
    CometChat.blockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: true}});

    }).catch(error => {
      console.log("Blocking user fails with error", error);
    });

  }

  unblockUser = () => {
    
    let usersList = [this.state.item.uid];
    CometChat.unblockUsers(usersList).then(list => {

        this.setState({item: {...this.state.item, blockedByMe: false}});

      }).catch(error => {
      console.log("unblocking user fails with error", error);
    });

  }

  toggleDetailView = () => {

    let viewdetail = !this.state.viewdetailscreen;
    this.setState({viewdetailscreen: viewdetail, threadmessageview: false});
  }

  toggleSideBar = () => {

    const sidebarview = this.state.sidebarview;
    this.setState({ sidebarview: !sidebarview });
  }

  deleteGroup = (group) => {

    this.toggleSideBar();
    this.setState({groupToDelete: group, item: {}, type: "group", viewdetailscreen: false});
  }

  leaveGroup = (group) => {

    this.toggleSideBar();
    this.setState({groupToLeave: group, item: {}, type: "group", viewdetailscreen: false});
  }

  updateMembersCount = (item, count) => {

    const group = Object.assign({}, this.state.item, {membersCount: count});
    this.setState({item: group, groupToUpdate: group});
  }

  groupUpdated = (message, key, group, options) => {
    
    switch(key) {
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_KICKED: {
        if(options.user.uid === this.loggedInUser.uid) {
          this.setState({item: {}, type: "group", viewdetailscreen: false});
        }
        break;
      }
      case enums.GROUP_MEMBER_SCOPE_CHANGED: {
        
        if(options.user.uid === this.loggedInUser.uid) {

          const newObj = Object.assign({}, this.state.item, {"scope": options["scope"]})
          this.setState({item: newObj, type: "group", viewdetailscreen: false});
        }
        break;
      }
      default:
      break;
    }
  }

  closeThreadMessages = () => {
    this.setState({viewdetailscreen: false, threadmessageview: false});
  }

  viewMessageThread = (parentMessage) => {

    const message = {...parentMessage};
    const threaditem = {...this.state.item};
    this.setState({
      threadmessageview: true, 
      threadmessageparent: message, 
      threadmessageitem: threaditem,
      threadmessagetype: this.state.type, 
      viewdetailscreen: false
    });
  }

  onThreadMessageComposed = (composedMessage) => {

    if(this.state.type !== this.state.threadmessagetype) {
      return false;
    }

    if((this.state.threadmessagetype === "group" && this.state.item.guid !== this.state.threadmessageitem.guid)
    || (this.state.threadmessagetype === "user" && this.state.item.uid !== this.state.threadmessageitem.uid)) {
      return false;
    }

    const message = {...composedMessage};
    this.setState({composedthreadmessage: message});
  }

  acceptedIncomingCall = (call) => {

    const type = call.receiverType;
    const id = call.receiverId;

    CometChat.getConversation(id, type).then(conversation => {

      this.itemClicked(conversation.conversationWith, type);
      this.setState({ incomingCall: call });

    }).catch(error => {

      console.log('error while fetching a conversation', error);
    });
  }

  rejectedIncomingCall = (incomingCallMessage, rejectedCallMessage) => {

    if (this.messageScreenRef) {
      this.messageScreenRef.rejectedIncomingCall(incomingCallMessage, rejectedCallMessage);
    }
  }

  toggleImageView = (message) => {
    this.setState({ imageView: message });
  }

  membersAdded = (members) => {

    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} ${Translator.translate("ADDED", this.state.lang)} ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  memberUnbanned = (members) => {

    const messageList = [];
    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} ${Translator.translate("UNBANNED", this.state.lang)} ${eachMember.name}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  memberScopeChanged = (members) => {

    const messageList = [];

    members.forEach(eachMember => {

      const message = `${this.loggedInUser.name} ${Translator.translate("MADE", this.state.lang)} ${eachMember.name} ${eachMember.scope}`;
      const sentAt = new Date() / 1000 | 0;
      const messageObj = { "category": "action", "message": message, "type": enums.ACTION_TYPE_GROUPMEMBER, "sentAt": sentAt };
      messageList.push(messageObj);
    });

    this.setState({ groupmessage: messageList });
  }

  render() {

    let threadMessageView = null;
    if(this.state.threadmessageview) {
      threadMessageView = (
        <div css={chatScreenSecondaryStyle(this.props.theme)} className="chats__secondary-view">
          <MessageThread
          theme={this.props.theme}
          tab={this.state.tab}
          item={this.state.threadmessageitem}
          type={this.state.threadmessagetype}
          parentMessage={this.state.threadmessageparent}
          loggedInUser={this.loggedInUser}
          lang={this.state.lang}
          actionGenerated={this.actionHandler} />
        </div>
      );
    }

    let detailScreen;
    if(this.state.viewdetailscreen) {

      if(this.state.type === "user") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.props.theme)} className="chats__secondary-view">
            <CometChatUserDetail
              theme={this.props.theme}
              item={this.state.item} 
              type={this.state.type}
              lang={this.state.lang}
              actionGenerated={this.actionHandler} />
          </div>);

      } else if (this.state.type === "group") {

        detailScreen = (
          <div css={chatScreenSecondaryStyle(this.props.theme)} className="chats__secondary-view">
          <CometChatGroupDetail
            theme={this.props.theme}
            item={this.state.item} 
            type={this.state.type}
            lang={this.state.lang}
            actionGenerated={this.actionHandler} />
          </div>
        );
      }
    }

    let messageScreen = null;
    if(Object.keys(this.state.item).length) {
      messageScreen = (
        <CometChatMessageListScreen
        ref={(el) => { this.messageScreenRef = el; }}
        theme={this.props.theme}
        item={this.state.item} 
        tab={this.state.tab}
        type={this.state.type}
        composedthreadmessage={this.state.composedthreadmessage}
        groupmessage={this.state.groupmessage}
        loggedInUser={this.loggedInUser}
        lang={this.state.lang}
        parentComponent="conversations"
        incomingCall={this.state.incomingCall}
        actionGenerated={this.actionHandler} />
      );
    }

    let imageView = null;
    if (this.state.imageView) {
      imageView = (<ImageView open={true} close={() => this.toggleImageView(null)} message={this.state.imageView} lang={this.state.lang} />);
    }

    return (
      <div css={chatScreenStyle(this.props.theme)} className="cometchat cometchat--chats" dir={Translator.getDirection(this.state.lang)}>
        <div css={chatScreenSidebarStyle(this.state, this.props.theme)} className="chats__sidebar">
          <CometChatConversationList
          theme={this.props.theme}
          item={this.state.item}
          type={this.state.type}
          lang={this.state.lang}
          groupToDelete={this.state.groupToDelete}
          groupToLeave={this.state.groupToLeave}
          groupToUpdate={this.state.groupToUpdate}
          messageToMarkRead={this.state.messageToMarkRead}
          unreadMessages={this.state.unreadMessages}
          onItemClick={this.itemClicked}
          lastMessage={this.state.lastmessage}
          actionGenerated={this.actionHandler}
          enableCloseMenu={Object.keys(this.state.item).length} />
        </div>
        <div css={chatScreenMainStyle(this.state)} className="chats__main">{messageScreen}</div>
        {detailScreen}
        {threadMessageView}
        {imageView}
        <CometChatIncomingCall
        theme={this.props.theme}
        lang={this.state.lang}
        actionGenerated={this.actionHandler} />
      </div>
    );
  }
}

// Specifies the default values for props:
CometChatConversationListScreen.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatConversationListScreen.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatConversationListScreen;