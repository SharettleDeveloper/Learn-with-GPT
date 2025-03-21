import { useEffect, useState } from "react";
import { ActivityIndicator, Button, FlatList, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

type CatProps = {
  name: string;
};

const Cat = (props: CatProps) => {
  const [isHungry, setIsHungry] = useState(true);
  return (
    <View>
      <Text>
        Iam {props.name} , and Iam {isHungry ? " お腹空きすぎました" : "お腹いっぱいです"}
      </Text>
      <Button
        onPress={() => {
          setIsHungry(false);
        }}
        disabled={!isHungry}
        title={isHungry ? "ご飯をくださいな" : "あなたは命の恩人です"}
      />
    </View>
  );
};

const PizzaTranslator = () => {
  const [text, setText] = useState("");
  return (
    <View style={{}}>
      <TextInput
        onChangeText={(newText) => {
          setText(newText);
        }}
        defaultValue={text}
        placeholder="Type here Tranlate"
        style={{ height: 20, width: 100, padding: 2 }}
      />
      <Text style={{ padding: 10, fontSize: 30 }}>
        {text
          .split("あ")
          .map((word) => {
            return word && "ああ";
          })
          .join("合体")}
      </Text>
      <Text>{text.split(" ")}</Text>
    </View>
  );
};

const logo = {
  uri: "https://reactnative.dev/img/tiny_logo.png",
  width: 64,
  height: 64,
};

const Scroll = () => {
  const array100 = Array.from({ length: 5 });
  return (
    <ScrollView>
      {array100.map((_, index) => (
        <>
          <Text>{index + 1}</Text>
          <Image source={logo} key={index} />
        </>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  item: {
    padding: 10,
    fontSize: 20,
    height: 14,
  },
});

const FlatListBasics = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { key: "Devin" },
          { key: "Dan" },
          { key: "Dominic" },
          { key: "Jackson" },
          { key: "James" },
          { key: "Joel" },
          { key: "John" },
          { key: "Jillian" },
          { key: "Jimmy" },
          { key: "Julie" },
        ]}
        renderItem={({ item, separators, index }) => (
          <Text style={styles.item}>
            {item.key}
            {index}
          </Text>
        )}
      />
    </View>
  );
};

const Circle = () => {
  const [radius, setRadius] = useState(1.1);
  useEffect(() => {
    const interval = setInterval(() => {
      setRadius((prev) => (prev < 30000 ? prev ** 1.05 : 1.1));
    }, 40);
    return () => clearInterval(interval);
  }, []);
  return <View style={{ height: radius, width: radius, backgroundColor: "#79f", borderRadius: radius / 2 }} />;
};
const FixedDimensionBasics = () => {
  return (
    <View>
      <View style={{ height: 50, width: 50, backgroundColor: "#79f", borderRadius: 25 }} />
      <View style={{ height: 100, width: 100, backgroundColor: "skyblue" }} />
      <View style={{ height: 150, width: 150, backgroundColor: "steelblue" }} />
    </View>
  );
};

type Movie = {
  id: string;
  title: string;
  releaseYear: string;
};

const MovieFetch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Movie[]>([]);

  const getMovie = async () => {
    try {
      const response = await fetch("https://reactnative.dev/movies.json");
      const json = await response.json();
      setData(json.movies);
      console.log(json);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    getMovie();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => (
            <Text style={{ color: "black" }}>
              {item.title}, {item.releaseYear}
            </Text>
          )}
        />
      )}
    </View>
  );
};

const Cafe = () => {
  return (
    <>
      <MovieFetch />
      <Cat name="Kuro" />
      <Cat name="Siro" />
      <PizzaTranslator />
      <Scroll />
      <FlatListBasics />
      <FixedDimensionBasics />
      <Circle />
      <Cat name="Taro" />
    </>
  );
};

export default Cafe;
