import Image from "next/image";
import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Pokemon from "../../components/Pokemon";
import { getTypeColor } from "../../components/TypeColor";

function PokemonDetail({ pokemon, species, previousPokemon }) {
  //#region useStates
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [thumbnailUrls, setThumbnailUrls] = useState([]);
  const [speciesInfo, setSpeciesInfo] = useState(species);
  const [pokeIndex, setPokeIndex] = useState(
    ("000" + pokemon.id).slice(-3).toString()
  );
  //#endregion

  //#region useEffect
  useEffect(() => {
    console.log("Species");
    console.log(speciesInfo);
    // set big image url
    setSelectedImageUrl(
      `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${pokeIndex}.png`
    );

    // set thumbnail image urls
    const spriteNames = ["front_default", "back_default"];

    const initThumbnailUrls = spriteNames.map((spriteName) =>
      pokemon.sprites[spriteName] ? pokemon.sprites[spriteName] : null
    );
    initThumbnailUrls.push(
      `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${pokeIndex}.png`
    );
    setThumbnailUrls(initThumbnailUrls);
  }, []);
  //#endregion

  //#region Variables
  const pokeName = pokemon.name[0].toUpperCase() + pokemon.name.slice(1);
  //#endregion

  //#region Functions
  const renderTypes = () =>
    pokemon.types.map((type) => {
      const color = getTypeColor(type.type.name);
      return (
        <li
          key={type.slot}
          className={`px-2 py-1 rounded text-white`}
          style={{ backgroundColor: `${color}` }}
        >
          {type.type.name}
        </li>
      );
    });

  const renderStats = () =>
    pokemon.stats.map((stat, index) => (
      <div key={index} className="my-2 rounded p-1 bg-slate-700">
        <div
          className="bg-slate-900 rounded px-2"
          style={{ width: `${stat.base_stat}%` }}
        >
          {stat.base_stat}
        </div>
      </div>
    ));

  const renderImages = () => {
    const spriteNames = ["front_default", "back_default"];
    const { sprites } = pokemon;
    return thumbnailUrls.map((url, index) => (
      <div
        key={index}
        className="bg-slate-400 bg-opacity-10 rounded-full my-8 hover:bg-opacity-50
        transition ease-in-out delay-100 hover:-translate-y-1 hover:scale-110 hover:bg-slate-800 duration-300"
      >
        <button onClick={() => handleThumbnailClick(url)}>
          <Image
            src={`${url}`}
            height={200}
            width={200}
            alt={pokemon.name}
            placeholder={"blur"}
            blurDataURL="/blackedPokemon.png"
          />
        </button>
      </div>
    ));
  };

  const handleThumbnailClick = (thumbnailUrl) => {
    setSelectedImageUrl(thumbnailUrl);
  };

  //#endregion

  return (
    <Layout title={pokeName}>
      <div className="flex flex-col justify-center items-center">
        <span className="absolute text-[400px] font-bold text-slate-500">
          #{pokeIndex}
        </span>
        <Image
          src={selectedImageUrl}
          height={400}
          width={400}
          alt={pokemon.name}
          placeholder={"blur"}
          blurDataURL="/blackedPokemon.png"
        />
      </div>

      <div className="flex flex-row justify-center items-center gap-9">
        {renderImages()}
      </div>

      <div className="bg-slate-900 rounded p-5">
        <ul className="flex gap-5">{renderTypes()}</ul>

        <div>{renderStats()}</div>
        <div>
          <Pokemon pokemon={previousPokemon} index={pokemon.id-1} />
        </div>
      </div>
    </Layout>
  );
}

export default PokemonDetail;

export async function getServerSideProps(context) {
  try {
    const poke_response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${context.query.name}`
    );
    const pokemon = await poke_response.json();

    // get species info
    const species_info_url = pokemon.species.url;
    console.log(species_info_url);
    const species_response = await fetch(species_info_url);
    const species = await species_response.json();

    // get previous Pokemon if not a baby
    let previousPokemon = null;
    if (!species.is_baby) {
      const previousPokemonUrl = species.evolves_from_species.url;
      const previous_species_response = await fetch(previousPokemonUrl);
      previousPokemon = await previous_species_response.json();
    }

    return {
      props: {
        pokemon,
        species,
        previousPokemon,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
