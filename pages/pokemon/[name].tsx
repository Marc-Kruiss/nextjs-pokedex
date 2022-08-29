import { GetServerSideProps } from "next";
import Image from "next/image";
import React, { useState, useEffect, ReactElement } from "react";
import useSWR from "swr";
import { mapPokemonInfo } from "../../components/helper/mapper";
import {
  getEvolvingChainNamesByUrl,
  getFilteredSprites,
  numberToThreeBasedString,
} from "../../components/helper/utilities";
import Layout from "../../components/Layout";
import Pokemon from "../../components/Pokemon";
import { getTypeColor } from "../../components/TypeColor";
import {
  IChainEntry,
  IPokemonBase,
  IPokemonInfo,
} from "../../components/types/PokemonInterfaces";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Link from "next/link";
import PokemonLayout from "../../components/layouts/PokemonLayout";

function PokemonDetail({ pokemonInfo, evolvingChainPokemons }: IPokemonBase) {
  //#region Variables

  let pokeIndex = ("000" + pokemonInfo.id).slice(-3).toString();

  const pokeName: string =
    pokemonInfo.name[0].toUpperCase() + pokemonInfo.name.slice(1);

  let thumbnailUrls: string[] = getFilteredSprites(
    pokeIndex,
    pokemonInfo.sprites
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState(thumbnailUrls[0]);
  //#endregion

  useEffect(() => {
    setSelectedImageUrl(thumbnailUrls[0]);
  }, [pokeIndex]);

  //#region Functions
  const renderTypes = () =>
    pokemonInfo.types.map((type, index) => {
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

  const renderStats = () => {
    const values: number[] = pokemonInfo.stats.map((s) => s.base_stat);
    const maxValue = Math.max(...values);
    return pokemonInfo.stats.map((stat, index) => (
      <div key={index} className="my-2 rounded p-1 bg-slate-700">
        <div
          className="bg-slate-900 rounded px-2"
          style={{ width: `${(stat.base_stat / maxValue) * 100}%` }}
        >
          <p className="w-max ">
            {stat.stat.name.toUpperCase()} : {stat.base_stat}
          </p>
        </div>
      </div>
    ));
  };

  const renderEvolutionChain = () =>
    evolvingChainPokemons
      ? evolvingChainPokemons.map((chainEntry, index) => (
          <div key={index} className="m-5">
            <Pokemon
              name={chainEntry.name}
              index={pokemonInfo.id + chainEntry.indexOffset - 1}
            />
          </div>
        ))
      : null;

  const renderImages = () => {
    return (
      <div>
        <Carousel
          animationHandler={"slide"}
          emulateTouch={true}
          showStatus={false}
          autoPlay={true}
          interval={2000}
          infiniteLoop={true}
          autoFocus={false}
          className="m-5"
        >
          {thumbnailUrls.map((url, index) => (
            <div
              key={index}
              className="bg-slate-400 bg-opacity-10 rounded-sm my-8 hover:bg-opacity-50
                      transition ease-in-out delay-100 hover:-translate-y-1 hover:scale-110 hover:bg-slate-800 duration-300"
            >
              <button onClick={() => setSelectedImageUrl(url)}>
                <Image
                  loading="eager"
                  src={`${url}`}
                  height={200}
                  width={200}
                  alt={pokemonInfo.name}
                  placeholder={"blur"}
                  blurDataURL="/blackedPokemon.png"
                />
              </button>
            </div>
          ))}
        </Carousel>
      </div>
    );
  };

  //#endregion

  return (
    <div className="w-full">
      <Layout title={pokeName}>
        <div
          className="flex flex-wrap
      flex-col 
      lg:flex-row"
        >
          <div
            className="flex flex-col justify-center items-center  
        lg:w-1/2"
          >
            <span className="absolute lg:text-[300px] text-[150px] top-[8rem] font-bold text-slate-500">
              #{pokeIndex}
            </span>
            <Image
              src={selectedImageUrl}
              height={400}
              width={400}
              quality={100}
              alt={pokemonInfo.name}
              placeholder={"blur"}
              blurDataURL="/blackedPokemon.png"
            />
            <div>{renderImages()}</div>
          </div>

          <div
            className="bg-slate-800 rounded p-5
        flex flex-col 
        lg:w-1/2"
          >
            <ul className="flex gap-5">{renderTypes()}</ul>

            <div>{renderStats()}</div>
            <div>{renderEvolutionChain()}</div>
          </div>
        </div>
      </Layout>
    </div>
  );
}

PokemonDetail.getLayout = function getLayout(page: ReactElement) {
  return <PokemonLayout>{page}</PokemonLayout>;
};
export default PokemonDetail;

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const poke_response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${context.query.name}`
    );
    const pokemon_json = await poke_response.json();

    // get species info
    const species_info_url = pokemon_json.species.url;
    const species_response = await fetch(species_info_url);
    const pokemonInfo: IPokemonInfo = await species_response
      .json()
      .then((species_json) => mapPokemonInfo(species_json, pokemon_json));

    // get evolving - chain
    const evolvingChainPokemons = await getEvolvingChainNamesByUrl(
      pokemonInfo.evolution_chain_url,
      pokemon_json.name
    );

    return {
      props: {
        pokemonInfo,
        evolvingChainPokemons,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
