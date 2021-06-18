import React,{Component} from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableHighlight,FlatList} from 'react-native';
import db from '../config';
import firebase from 'firebase';
import MyHeader from '../components/MyHeader';
import {ScrollView} from "react-native-gesture-handler";
import Autocomplete from 'react-native-autocomplete-input';

export default class CreateScreen extends Component {
    constructor() {
        super();
        this.state ={
          userId : firebase.auth().currentUser.email,
          topic:"",
          description:"",
          targetedUserId: "",
          docId: "",
          points: null,
          image: '',
          firstName: '',
          lastName: '',
          userName: '',
          targetUserName: '',
          showFlatList: false,
          users: [],
          searchText: ''
        }
        this.requestRef = null
        this.arrayholder = []
    }

    getUserDetails = () => {
        db.collection("Users").where("emailID","==",this.state.userId).get()
        .then(snapshot => {
            snapshot.forEach((doc) => {
                this.setState({
                    firstName: doc.data().firstName,
                    lastName: doc.data().lastName,
                    userName: doc.data().firstName + " " + doc.data().lastName,
                    docId: doc.id
                })
            })
        })
    }

    fetchImage = (imageName) => {
        var storageRef = firebase.storage().ref().child("user_profiles/"+imageName);
        storageRef.getDownloadURL()
        .then((url)=>{
            this.setState({
                image: url
            })
        })
        .catch((error)=>{
            this.setState({
                image: '#'
            })
        })
    }

    addConversationNotification = () => {
        var message = this.state.userName + " has started a conversation with you named "+this.state.topic+".";
            db.collection("AllNotifications").add({
                "message": message,
                "notificationStatus": "unread",
                "date": firebase.firestore.FieldValue.serverTimestamp(),
                "targetedUserId": this.state.targetedUserId,
                "userId": this.state.userId,
                "image": this.state.image,
                "type": 'conversation'
            })
    }

    createUniqueId(){
        return Math.random().toString(36).substring(7);
    }

    getUsers = () => {
        if(this.state.searchText === '') {
            this.requestRef = db.collection('Users')
            .onSnapshot((snapshot)=>{
              var users = snapshot.docs.map(document => document.data());
              this.setState({
                users : users
              });
              this.arrayholder = snapshot.docs.map(document => document.data());
            }) 
        }
        else {
           this.setState({
               users: []
           }) 
        }

        console.log('users:',this.state.users)
    }

    searchUsers = (text) => {
        this.setState({
            targetedUserId: text,
            showFlatList: true 
        })
        
            const newData = this.arrayholder.filter(item => {      
                const itemData = `${item.emailID}`.toUpperCase();
                
                 const textData = text.toUpperCase();
                  
                 return itemData.indexOf(textData) > -1;    
              });
              
              this.setState({ users: newData});
        
        
    }

    keyExtractor = (item, index) => index.toString();

    renderItem = ({ item, i }) => {
        let obj = {
          /*title: item.volumeInfo.title,
          selfLink: item.selfLink,
          buyLink: item.saleInfo.buyLink,
          imageLink: item.volumeInfo.imageLinks*/
        }
        return (
          <TouchableHighlight
            style={{
              alignItems: "center",
              backgroundColor: "white",
              padding: 10,
              width: '90%',
              borderWidth: 0.5,
              borderRadius: 0
            }}
            activeOpacity={0.6}
            underlayColor="#00008B"
            onPress={() => {
              this.setState({
                showFlatList: false,
                targetedUserId: item.emailID
              })
            }
            }
            bottomDivider>
            <Text> {item.emailID} </Text>
          </TouchableHighlight>
        )
      }

    addConversation = (topic, description, targetedUserId) => {
        
        conversationId = this.createUniqueId();
       
        if(targetedUserId !== this.state.userId && this.state.topic !== '' && this.state.description !== '') {
            db.collection("Conversations").add({
                "topic": topic,
                "description": description,
                "targetedUserId": targetedUserId.toLowerCase(),
                "targetedUserId2": this.state.userId.toLowerCase(),
                "requestId": conversationId,
                "targetUserName": this.state.targetUserName,
                "userName": this.state.userName
            })
            db.collection("Conversations").add({
                "topic": topic,
                "description": description,
                "targetedUserId": this.state.userId.toLowerCase(),
                "targetedUserId2": targetedUserId.toLowerCase(),
                "requestId": conversationId,
                "targetUserName": this.state.targetUserName,
                "userName": this.state.userName
            })
            .then(()=>{
                this.setState({
                    topic: '',
                    description: '',
                    targetedUserId: ''
                })
            })

            return alert("If this user already has an account, you have successfully started a conversation with them!")
        }
        else if(this.state.topic === '') {
            return alert("Please provide the name of the conversation.")
        }
        else if(this.state.description === ''){
            return alert("Please provide what the conversation is about.")
        }
        else {
            return alert("You cannot start a conversation with yourself.")
        }
    }

    findTarget = (targetedUserId) => {
        
        db.collection("Users").where("emailID", "==", targetedUserId)
            .get()
            .then(snapshot => {
                snapshot.forEach((doc) => {
                    this.setState({
                        targetUserName: doc.data().firstName + " " + doc.data().lastName,
                    })
                })
            })
            .then(() => {
                this.addConversation(this.state.topic,this.state.description, this.state.targetedUserId)
            }
            )
        //console.log("dddd",this.state.targetUserName)
    }

    componentDidMount() {
        this.getUserDetails();
        this.fetchImage(this.state.userId);
        this.getUsers();
    }

    render() {
        //if(this.state.showFlatList === true) {
            return(
                <View style={{flex: 1}}>
                     <MyHeader
                    title="Create"
                    navigation={this.props.navigation}/>
                    
                 <KeyboardAvoidingView style={styles.keyBoardStyle}>
                 <TextInput
                    style ={styles.formTextInput}
                    placeholder={"Add The User (Email)"}
                    autoCapitalize = {false}
                    /*onChangeText={(text)=>{
                        this.setState({
                            targetedUserId:text
                        })
                    }}*/
                    onChangeText={text => this.searchUsers(text)}
                    onClear={text => this.searchUsers('')}
                    value={this.state.targetedUserId}
                  /> 
                {this.state.showFlatList ? (
                    <FlatList
                    keyExtractor={this.keyExtractor}
                    data={this.state.users}
                    renderItem={this.renderItem}
                    enableEmptySections={false}
                    style={{ marginTop: 10, marginLeft: 20 }}
  
                  />
                ) : (
                    <View style={{ alignItems: 'center' }}>
                          <TextInput
                    style ={styles.formTextInput}
                    placeholder={"Topic"}
                    onChangeText={(text)=>{
                        this.setState({
                            topic:text
                        })
                    }}
                    value={this.state.topic}
                  />
                  <TextInput
                    style ={[styles.formTextInput,{height:150}]}
                    multiline
                    numberOfLines ={4}
                    placeholder={"Description"}
                    onChangeText ={(text)=>{
                        this.setState({
                            description: text
                        })
                    }}
                    value ={this.state.description}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={()=>{
                        //this.findTarget(this.state.targetedUserId)
                        this.addConversationNotification(this.state.userId)
                        this.addConversation(this.state.topic,this.state.description, this.state.targetedUserId)
                    }}>
                    <Text style={{color:'white', fontFamily: 'PoppinsRegular'}}>Submit</Text>
                  </TouchableOpacity>
                    </View>
                )}
                    
                
               
            
                </KeyboardAvoidingView>
                
                </View>
            )
        //}
        //else {
            
       // }
        
        
    }
}

const styles = StyleSheet.create({
    keyBoardStyle : {
      flex:1,
      alignItems:'center',
      justifyContent:'center'
    },
    formTextInput:{
      width:"75%",
      height:40,
      alignSelf:'center',
      borderColor:'black',
      borderRadius:10,
      borderWidth:0.5,
      marginTop:25,
      padding:10,
      fontSize: 10,
      fontFamily: 'PoppinsRegular'
    },
    button:{
      width:"75%",
      height:50,
      justifyContent:'center',
      alignItems:'center',
      borderRadius:10,
      backgroundColor:"#0d1d52",
      shadowColor: "#000",
      shadowOffset: {
         width: 0,
         height: 0,
      },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 16,
      marginTop:20
      },
    }
  )